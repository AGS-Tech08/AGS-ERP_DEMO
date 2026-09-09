<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\RewardAccount;
use App\Models\RewardItem;
use App\Models\RewardSetting;
use App\Models\RewardTransaction;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RewardController extends Controller
{
    public function settings()
    {
        $settings = RewardSetting::first();

        if (!$settings) {
            $settings = RewardSetting::create([
                'purchase_amount' => 100,
                'reward_points' => 10,
                'minimum_redeem_points' => 100,
                'points_expiry_days' => 365,
                'enable_points_expiry' => true,
                'status' => 'Active',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'purchase_amount' => ['required', 'numeric', 'min:1'],
            'reward_points' => ['required', 'integer', 'min:1'],
            'minimum_redeem_points' => ['required', 'integer', 'min:1'],
            'points_expiry_days' => ['required', 'integer', 'min:1'],
            'enable_points_expiry' => ['required', 'boolean'],
        ]);

        $settings = RewardSetting::firstOrCreate([
            'status' => 'Active',
        ]);

        $settings->fill($validated)->save();

        return response()->json([
            'success' => true,
            'message' => 'Reward settings updated successfully.',
            'data' => $settings,
        ]);
    }

    public function getCustomerReward(Customer $customer)
    {
        $account = RewardAccount::firstOrCreate(
            ['customer_id' => $customer->id],
            [
                'available_points' => 0,
                'total_earned' => 0,
                'total_redeemed' => 0,
                'status' => 'Active',
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $account,
        ]);
    }

    public function rewardHistory(Customer $customer)
    {
        $transactions = RewardTransaction::where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    public function rewardItems()
    {
        return response()->json([
            'success' => true,
            'data' => RewardItem::orderBy('name')->get(),
        ]);
    }

    public function storeRewardItem(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'points_required' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:Active,Inactive'],
        ]);

        $item = RewardItem::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reward item created successfully.',
            'data' => $item,
        ], 201);
    }

    public function updateRewardItem(Request $request, RewardItem $rewardItem)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'points_required' => ['sometimes', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:Active,Inactive'],
        ]);

        $rewardItem->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reward item updated successfully.',
            'data' => $rewardItem,
        ]);
    }

    public function destroyRewardItem(RewardItem $rewardItem)
    {
        $rewardItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Reward item deleted successfully.',
        ]);
    }

    public function redeemReward(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'reward_item_id' => ['required', 'integer', 'exists:reward_items,id'],
            'description' => ['nullable', 'string'],
        ]);

        $customer = Customer::findOrFail($validated['customer_id']);
        $item = RewardItem::findOrFail($validated['reward_item_id']);
        $settings = RewardSetting::firstOrCreate(
            ['status' => 'Active'],
            [
                'purchase_amount' => 100,
                'reward_points' => 10,
                'minimum_redeem_points' => 100,
                'points_expiry_days' => 365,
                'enable_points_expiry' => true,
                'status' => 'Active',
            ]
        );

        return DB::transaction(function () use ($customer, $item, $settings, $validated) {
            $account = RewardAccount::lockForUpdate()->firstOrCreate(
                ['customer_id' => $customer->id],
                ['available_points' => 0, 'total_earned' => 0, 'total_redeemed' => 0, 'status' => 'Active']
            );

            if ($account->available_points < $item->points_required) {
                abort(422, 'Insufficient reward points for this redemption.');
            }

            if ($item->points_required < $settings->minimum_redeem_points) {
                abort(422, 'This item does not meet the minimum redemption requirement.');
            }

            $newBalance = $account->available_points - $item->points_required;

            $account->available_points = $newBalance;
            $account->total_redeemed += $item->points_required;
            $account->save();

            RewardTransaction::create([
                'customer_id' => $customer->id,
                'reward_account_id' => $account->id,
                'type' => 'Redeemed',
                'points' => -$item->points_required,
                'balance_after' => $newBalance,
                'reference_type' => 'reward_item',
                'reference_id' => $item->id,
                'description' => $validated['description'] ?? 'Reward item redemption',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reward redeemed successfully.',
                'data' => [
                    'customer_id' => $customer->id,
                    'balance' => $newBalance,
                    'item' => $item,
                ],
            ]);
        });
    }

    public function awardPointsForSale(Sale $sale)
    {
        if (!$sale->customer_id) {
            return response()->json(['success' => true, 'message' => 'No customer linked to sale.']);
        }

        $settings = RewardSetting::firstOrCreate(
            ['status' => 'Active'],
            [
                'purchase_amount' => 100,
                'reward_points' => 10,
                'minimum_redeem_points' => 100,
                'points_expiry_days' => 365,
                'enable_points_expiry' => true,
                'status' => 'Active',
            ]
        );

        if ($sale->grand_total <= 0) {
            return response()->json(['success' => true, 'message' => 'No reward points earned.']);
        }

        $points = (int) floor(($sale->grand_total / $settings->purchase_amount) * $settings->reward_points);

        if ($points <= 0) {
            return response()->json(['success' => true, 'message' => 'No reward points earned.']);
        }

        return DB::transaction(function () use ($sale, $points, $settings) {
            $account = RewardAccount::lockForUpdate()->firstOrCreate(
                ['customer_id' => $sale->customer_id],
                ['available_points' => 0, 'total_earned' => 0, 'total_redeemed' => 0, 'status' => 'Active']
            );

            $account->available_points += $points;
            $account->total_earned += $points;
            $account->save();

            RewardTransaction::create([
                'customer_id' => $sale->customer_id,
                'reward_account_id' => $account->id,
                'type' => 'Earned',
                'points' => $points,
                'balance_after' => $account->available_points,
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'description' => 'Points earned from sale invoice ' . $sale->invoice_no,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reward points awarded successfully.',
                'data' => [
                    'customer_id' => $sale->customer_id,
                    'points' => $points,
                    'balance' => $account->available_points,
                ],
            ]);
        });
    }
}
