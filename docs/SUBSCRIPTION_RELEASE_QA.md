# Subscription flows — release build QA

Run these checks on a **release** binary from EAS (or `expo run:ios --configuration Release` / `expo run:android --variant release`). Metro `__DEV__` must be **false** so local premium bypass and RevenueCat REST test purchases are disabled.

## Preconditions

- Production RevenueCat iOS/Android API keys are set for the release build.
- Native in-app purchases are integrated (e.g. RevenueCat Purchases SDK) so checkout and restore use **App Store / Google Play**, not the dev-only REST receipt path in `SubscriptionProvider`.

## Scenarios

1. **Upgrade (new subscriber)**  
   Open Premium / plans, complete purchase with a **sandbox** store account, confirm premium unlocks and the correct entitlement appears in RevenueCat.

2. **Restore**  
   After purchase, delete app data or reinstall, tap **Restore**, confirm premium returns when signed into the same store account.

3. **Expiration / lapse**  
   Let a sandbox subscription expire (or revoke in App Store Connect / Play Console), pull to refresh or reopen app, confirm premium gates reappear and `subscription` tier returns to free when RC reports inactive entitlement.

4. **Manage subscription**  
   From Settings (or Premium screen), open **App Store subscriptions** / **Play subscriptions** and confirm the subscription is listed and cancellable there.

5. **Negative: no local bypass**  
   With network off or invalid RC key, confirm **Restore** does **not** unlock premium and **no** “Premium Activated (dev)” style alerts appear.

6. **Premium upgrade screen**  
   With no native IAP wired, confirm **Start Premium** does not perform a fake checkout (dev-only REST path is blocked in release).
