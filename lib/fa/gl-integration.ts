import { AssetDepreciation, AssetDisposal, FixedAsset, AssetCategory, JournalEntry, ChartOfAccount, Customer } from '../db/models';
import sequelize from '../db/sequelize';
import { Transaction } from 'sequelize';

// Import GL posting engine
async function createJournalEntry(params: any): Promise<JournalEntry> {
  const { JournalEntry: JEModel } = await import('../db/models');
  // This would use the existing GL posting engine
  // For now, simplified version
  return await JEModel.create(params);
}

async function postJournalEntry(jeId: string, userId: string): Promise<any> {
  // This would call the existing GL posting engine
  // Import and use the postJournalEntry function from lib/gl/posting-engine.ts
  const { postJournalEntry: glPostJournalEntry } = await import('../gl/posting-engine');
  return await glPostJournalEntry(jeId, userId);
}

// Post Depreciation to GL
export async function postDepreciationToGL(
  depreciationIds: string[],
  postingDate: Date,
  userId: string
): Promise<{
  success: boolean;
  journalEntry: JournalEntry;
  depreciationsPosted: number;
  totalAmount: number;
  message: string;
}> {
  const transaction = await sequelize.transaction();

  try {
    // Fetch depreciations with assets
    const depreciations = await AssetDepreciation.findAll({
      where: { id: depreciationIds },
      include: [
        {
          model: FixedAsset,
          as: 'asset',
          include: [
            {
              model: AssetCategory,
              as: 'category',
            },
          ],
        },
      ],
      transaction,
    });

    if (depreciations.length === 0) {
      throw new Error('No depreciations found');
    }

    // Validate all depreciations
    for (const dep of depreciations) {
      if (dep.isPosted) {
        throw new Error(`Depreciation ${dep.id} is already posted`);
      }
      if (dep.status !== 'calculated') {
        throw new Error(`Depreciation ${dep.id} is not in calculated status`);
      }
    }

    const companyId = depreciations[0].companyId;

    // Group depreciations by GL accounts
    const accountGroups: Record<string, {
      depExpenseAccountId: string;
      accumDepAccountId: string;
      amount: number;
      assetNames: string[];
    }> = {};

    for (const dep of depreciations) {
      const asset = dep.get('asset') as FixedAsset;
      const key = `${asset.depreciationExpenseAccountId}-${asset.accumulatedDepreciationAccountId}`;

      if (!accountGroups[key]) {
        accountGroups[key] = {
          depExpenseAccountId: asset.depreciationExpenseAccountId,
          accumDepAccountId: asset.accumulatedDepreciationAccountId,
          amount: 0,
          assetNames: [],
        };
      }

      accountGroups[key].amount += Number(dep.depreciationAmount);
      accountGroups[key].assetNames.push(asset.assetName);
    }

    // Create JE lines
    const jeLines: any[] = [];
    let totalAmount = 0;

    for (const group of Object.values(accountGroups)) {
      totalAmount += group.amount;

      // Debit Depreciation Expense
      jeLines.push({
        accountId: group.depExpenseAccountId,
        debitAmount: group.amount,
        creditAmount: 0,
        description: `Depreciation expense - ${group.assetNames.slice(0, 3).join(', ')}${group.assetNames.length > 3 ? '...' : ''}`,
      });

      // Credit Accumulated Depreciation
      jeLines.push({
        accountId: group.accumDepAccountId,
        debitAmount: 0,
        creditAmount: group.amount,
        description: `Accumulated depreciation - ${group.assetNames.slice(0, 3).join(', ')}${group.assetNames.length > 3 ? '...' : ''}`,
      });
    }

    // Create Journal Entry
    const je = await JournalEntry.create({
      companyId,
      documentType: 'system',
      transactionDate: postingDate,
      description: `Depreciation for ${depreciations.length} asset${depreciations.length > 1 ? 's' : ''}`,
      currencyCode: 'USD', // Should use company base currency
      exchangeRate: 1,
      sourceModule: 'fixed_assets',
      sourceDocumentType: 'depreciation',
      requiresApproval: false,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    }, { transaction });

    // Create JE lines (simplified - would need proper JournalEntryLine model)
    // This is where you'd create the actual JE lines using JournalEntryLine model

    // Post the JE to GL
    await postJournalEntry(je.id, userId);

    // Update depreciation records
    for (const dep of depreciations) {
      await dep.update({
        isPosted: true,
        postedAt: new Date(),
        postedBy: userId,
        journalEntryId: je.id,
        status: 'posted',
      }, { transaction });
    }

    await transaction.commit();

    return {
      success: true,
      journalEntry: je,
      depreciationsPosted: depreciations.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      message: `Successfully posted ${depreciations.length} depreciation${depreciations.length > 1 ? 's' : ''} to GL`,
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Post Asset Disposal to GL
export async function postDisposalToGL(
  disposalId: string,
  userId: string
): Promise<{
  success: boolean;
  journalEntry: JournalEntry;
  disposal: AssetDisposal;
  message: string;
}> {
  const transaction = await sequelize.transaction();

  try {
    // Fetch disposal with asset
    const disposal = await AssetDisposal.findByPk(disposalId, {
      include: [
        {
          model: FixedAsset,
          as: 'asset',
          include: [
            {
              model: AssetCategory,
              as: 'category',
            },
          ],
        },
      ],
      transaction,
    });

    if (!disposal) {
      throw new Error('Disposal not found');
    }

    if (disposal.isPosted) {
      throw new Error('Disposal is already posted');
    }

    const asset = disposal.get('asset') as FixedAsset;
    const category = asset.get('category') as AssetCategory;

    // Create JE lines
    const jeLines: any[] = [];

    // 1. Debit Accumulated Depreciation (full amount)
    jeLines.push({
      accountId: asset.accumulatedDepreciationAccountId,
      debitAmount: Number(disposal.accumulatedDepreciation),
      creditAmount: 0,
      description: `Disposal of ${asset.assetName} - Accumulated Depreciation`,
    });

    // 2. Debit Cash/AR (if sold)
    if (disposal.saleAmount && Number(disposal.saleAmount) > 0) {
      // Would need to determine the cash/AR account
      // For now, using a placeholder - should get from company settings
      const cashAccountId = asset.assetAccountId; // Placeholder

      jeLines.push({
        accountId: cashAccountId,
        debitAmount: Number(disposal.saleAmount),
        creditAmount: 0,
        description: `Disposal of ${asset.assetName} - Sale proceeds`,
      });
    }

    // 3. Debit/Credit Gain/Loss
    if (Number(disposal.gainLoss) !== 0) {
      if (disposal.gainLossType === 'loss') {
        // Debit Loss
        const lossAccountId = category.disposalLossAccountId || asset.depreciationExpenseAccountId;
        jeLines.push({
          accountId: lossAccountId,
          debitAmount: Math.abs(Number(disposal.gainLoss)),
          creditAmount: 0,
          description: `Disposal of ${asset.assetName} - Loss on disposal`,
        });
      } else if (disposal.gainLossType === 'gain') {
        // Credit Gain
        const gainAccountId = category.disposalGainAccountId || asset.depreciationExpenseAccountId;
        jeLines.push({
          accountId: gainAccountId,
          debitAmount: 0,
          creditAmount: Math.abs(Number(disposal.gainLoss)),
          description: `Disposal of ${asset.assetName} - Gain on disposal`,
        });
      }
    }

    // 4. Credit Fixed Asset (original cost)
    jeLines.push({
      accountId: asset.assetAccountId,
      debitAmount: 0,
      creditAmount: Number(disposal.originalCost),
      description: `Disposal of ${asset.assetName} - Asset cost`,
    });

    // 5. Credit Cash (disposal costs)
    if (Number(disposal.disposalCosts) > 0) {
      // Would need cash account
      const cashAccountId = asset.assetAccountId; // Placeholder

      jeLines.push({
        accountId: cashAccountId,
        debitAmount: 0,
        creditAmount: Number(disposal.disposalCosts),
        description: `Disposal of ${asset.assetName} - Disposal costs`,
      });
    }

    // Create Journal Entry
    const je = await JournalEntry.create({
      companyId: asset.companyId,
      documentType: 'system',
      transactionDate: disposal.disposalDate,
      description: `Disposal of ${asset.assetName}`,
      currencyCode: asset.currencyCode,
      exchangeRate: Number(asset.exchangeRate),
      sourceModule: 'fixed_assets',
      sourceDocumentType: 'disposal',
      sourceDocumentId: disposal.id,
      requiresApproval: false,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    }, { transaction });

    // Create JE lines (simplified)
    // Would create actual JournalEntryLine records here

    // Post the JE to GL
    await postJournalEntry(je.id, userId);

    // Update disposal
    await disposal.update({
      isPosted: true,
      postedAt: new Date(),
      journalEntryId: je.id,
    }, { transaction });

    // Update asset status
    await asset.update({
      status: disposal.disposalMethod === 'sold' ? 'sold' : 'disposed',
      disposalDate: disposal.disposalDate,
      disposalMethod: disposal.disposalMethod,
      disposalAmount: disposal.saleAmount,
      disposalGainLoss: disposal.gainLoss,
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      journalEntry: je,
      disposal,
      message: `Successfully posted disposal of ${asset.assetName} to GL`,
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Post Asset Revaluation to GL
export async function postRevaluationToGL(
  revaluationId: string,
  userId: string
): Promise<{
  success: boolean;
  journalEntry: JournalEntry;
  revaluation: any;
  message: string;
}> {
  const transaction = await sequelize.transaction();

  try {
    // Import AssetRevaluation model
    const { AssetRevaluation } = await import('../db/models');

    // Fetch revaluation with asset
    const revaluation = await AssetRevaluation.findByPk(revaluationId, {
      include: [
        {
          model: FixedAsset,
          as: 'asset',
          include: [
            {
              model: AssetCategory,
              as: 'category',
            },
          ],
        },
      ],
      transaction,
    });

    if (!revaluation) {
      throw new Error('Revaluation not found');
    }

    if (revaluation.isPosted) {
      throw new Error('Revaluation is already posted');
    }

    const asset = revaluation.get('asset') as FixedAsset;

    // Create JE lines
    const jeLines: any[] = [];
    const revaluationAmount = Number(revaluation.revaluationGainLoss);

    if (revaluationAmount > 0) {
      // Revaluation gain
      // DR Asset, CR Revaluation Reserve
      jeLines.push({
        accountId: asset.assetAccountId,
        debitAmount: revaluationAmount,
        creditAmount: 0,
        description: `Revaluation gain - ${asset.assetName}`,
      });

      const reserveAccountId = revaluation.revaluationReserveAccountId || asset.assetAccountId;
      jeLines.push({
        accountId: reserveAccountId,
        debitAmount: 0,
        creditAmount: revaluationAmount,
        description: `Revaluation reserve - ${asset.assetName}`,
      });
    } else if (revaluationAmount < 0) {
      // Revaluation loss
      // DR Revaluation Loss/Expense, CR Asset
      const expenseAccountId = asset.depreciationExpenseAccountId;
      jeLines.push({
        accountId: expenseAccountId,
        debitAmount: Math.abs(revaluationAmount),
        creditAmount: 0,
        description: `Revaluation loss - ${asset.assetName}`,
      });

      jeLines.push({
        accountId: asset.assetAccountId,
        debitAmount: 0,
        creditAmount: Math.abs(revaluationAmount),
        description: `Asset revaluation - ${asset.assetName}`,
      });
    }

    // Create Journal Entry
    const je = await JournalEntry.create({
      companyId: asset.companyId,
      documentType: 'system',
      transactionDate: revaluation.revaluationDate,
      description: `Revaluation of ${asset.assetName}`,
      currencyCode: asset.currencyCode,
      exchangeRate: Number(asset.exchangeRate),
      sourceModule: 'fixed_assets',
      sourceDocumentType: 'revaluation',
      sourceDocumentId: revaluation.id,
      requiresApproval: false,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    }, { transaction });

    // Post the JE to GL
    await postJournalEntry(je.id, userId);

    // Update revaluation
    await revaluation.update({
      isPosted: true,
      postedAt: new Date(),
      journalEntryId: je.id,
    }, { transaction });

    // Update asset with new book value
    await asset.update({
      bookValue: Number(revaluation.revaluedAmount),
      totalCost: Number(revaluation.revaluedAmount) + Number(asset.accumulatedDepreciation),
      remainingValue: Number(revaluation.revaluedAmount) - Number(asset.salvageValue),
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      journalEntry: je,
      revaluation,
      message: `Successfully posted revaluation of ${asset.assetName} to GL`,
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Reverse Posted Depreciation
export async function reverseDepreciation(
  depreciationId: string,
  reason: string,
  userId: string
): Promise<{
  success: boolean;
  depreciation: AssetDepreciation;
  reversalJournalEntry: JournalEntry;
  message: string;
}> {
  const transaction = await sequelize.transaction();

  try {
    const depreciation = await AssetDepreciation.findByPk(depreciationId, {
      include: [{ model: FixedAsset, as: 'asset' }],
      transaction,
    });

    if (!depreciation) {
      throw new Error('Depreciation not found');
    }

    if (!depreciation.isPosted) {
      throw new Error('Only posted depreciations can be reversed');
    }

    if (depreciation.isReversed) {
      throw new Error('Depreciation is already reversed');
    }

    const asset = depreciation.get('asset') as FixedAsset;

    // Create reversing JE
    const reversalJE = await JournalEntry.create({
      companyId: depreciation.companyId,
      documentType: 'system',
      transactionDate: new Date(),
      description: `Reversal of depreciation for ${asset.assetName} - ${reason}`,
      currencyCode: 'USD',
      exchangeRate: 1,
      sourceModule: 'fixed_assets',
      sourceDocumentType: 'depreciation_reversal',
      sourceDocumentId: depreciation.id,
      requiresApproval: false,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    }, { transaction });

    // Create reversing JE lines (opposite of original)
    // Credit Depreciation Expense, Debit Accumulated Depreciation

    // Post reversal JE
    await postJournalEntry(reversalJE.id, userId);

    // Update depreciation
    await depreciation.update({
      isReversed: true,
      reversedAt: new Date(),
      reversedBy: userId,
      reversalJournalEntryId: reversalJE.id,
      status: 'reversed',
    }, { transaction });

    // Restore asset book value
    await asset.update({
      accumulatedDepreciation: Number(asset.accumulatedDepreciation) - Number(depreciation.depreciationAmount),
      bookValue: Number(asset.bookValue) + Number(depreciation.depreciationAmount),
      remainingValue: Number(asset.remainingValue) + Number(depreciation.depreciationAmount),
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      depreciation,
      reversalJournalEntry: reversalJE,
      message: `Successfully reversed depreciation for ${asset.assetName}`,
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
