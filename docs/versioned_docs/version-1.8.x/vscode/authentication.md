---
id: authentication
title: Authentication
---

Authentication is used to assert that a valid subscription token is available.
This only required if you would like to enable all features of the extension.

## Step 1: Register

You can register with https://bzl.io via GitHub OAuth or Email:

![image](https://user-images.githubusercontent.com/50580/144350413-9b2963a0-9a8e-447f-88af-224d9dfa65dc.png)

GitHub is preferred for ease of use, but requires that you have a *Public email*
configured in your https://github.com/settings/profile.  Otherwise, use the
traditional email flow:

![image](https://user-images.githubusercontent.com/50580/144350530-258ce0b8-3f4f-4224-88be-12c1ccbc024a.png)

We don't spam or use your email for any purpose other than to notify you of updates.

## Step 2: Choose a Subscription Plan

![image](https://user-images.githubusercontent.com/50580/144350922-b78071d7-733c-4b70-a41a-b13638f80a79.png)

Not to worry, you can cancel at any time.  Your payment credentials are not
transmitted or stored outside of the payment processor (Stripe).

## Step 3: Configure the Extension

Click the **Configure VSCode Extension** button:

![image](https://user-images.githubusercontent.com/50580/144351208-650e06c0-46d3-4518-b617-4bf7f85cbabe.png)

This will copy your authentication token to `$HOME/.bzl/license.key` and
activate the extension subscription features.

![image](https://user-images.githubusercontent.com/50580/144351565-53b85f5c-9d7b-445f-a651-8e3b0df91a79.png)

If you'd like to cancel, visit https://bzl.io/settings/subscription:

![image](https://user-images.githubusercontent.com/50580/144352764-b632d49f-fdef-4ca7-a3fd-3e5c6196c716.png)

