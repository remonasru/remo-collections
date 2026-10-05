# Responsive Checkout Layout

## Goal
Make the cart, order summary, and Place Order form fit every phone and desktop viewport without horizontal scrolling or cropped controls.

## Changes
- Constrain the checkout page, cart rows, summary, and modal to the available viewport width with full-width, max-width, and overflow guards.
- Rework mobile cart rows and checkout actions so product details, prices, payment choices, and buttons wrap or stack cleanly.
- Keep the existing desktop shopping flow, using a centered contained two-column cart/summary layout.
- Make the delivery modal use safe mobile gutters, height limits, and full-width form controls without exceeding the screen.

## Validation
- Check the cart and open Place Order form at 394×676 and a desktop viewport.
- Confirm no horizontal overflow, clipping, or overlapping text and controls.
- Confirm the current order, coupon, payment, UPI, and WhatsApp behavior remains unchanged.
