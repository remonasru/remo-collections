# Remo Collections E-commerce

Role & Objective:

Act as a World-Class Full-Stack Developer and UI/UX Designer. Build a fully functional, highly secure, responsive, and mobile-friendly e-commerce clothing sales website named "Remo Collections" inspired by platforms like Flipkart. The platform must include a Customer Storefront and a dedicated Admin Panel with zero bugs.

​Design Theme & Branding:

​Brand Name: Remo Collections

​Color Palette: A vibrant, modern blend of Deep Blue and Soft Pink with clean white backgrounds for product displays.

​Typography & Feel: Premium, user-friendly, and professional e-commerce layout.

​1. Customer Storefront Features:

​Header & Navigation:

​Brand Logo ("Remo Collections").

​Live Search bar with filter options.

​Direct category tabs: Men, Women, Kids.

​Interactive Cart and Wishlist icons with dynamic count badges.

​Home Page:

​Hero banner showcasing trending collections or discounts.

​Featured category sections (Men, Women, Kids) that dynamically display uploaded products.

​Product Detail Page (PDP):

​Clicking any product opens its dedicated page.

​Displays high-res product gallery images, title, price, discount percentage, size selector (S, M, L, XL, XXL), and detailed description.

​Prominent tag line below description: "All over India Delivery".

​Buttons: Add to Cart and Buy Now.

​Interactive Customer Review System: Customers can leave ratings (1 to 5 stars) and write written reviews that instantly save and display under the product.

​Cart & Checkout Process:

​View itemized cart items, change quantities, and calculate total cost.

​Clicking "Place Order" prompts a modal asking for Customer Name, Full Delivery Address, Mobile Number, and Payment Preference.

​WhatsApp Direct Order Integration:

​Upon clicking "Confirm Order", instantly format the entire order details (Customer Name, Address, Phone, Product List, Sizes, Total Amount) and automatically redirect/send it via WhatsApp API to +918903206428.

​Footer:

​Displays full store contact info:

Remo Collections

No. 30 VAK Nagar, Arni - 632301,

Tiruvannamalai District.

​2. Secure Admin Panel Features:

​Authentication Gatekeeper:

​Admin panel must be strictly password-protected with zero bypass vulnerabilities.

​Direct login check:

​Username: Remo Collections

​Password: RemoNasru20

​If credentials match, grant access; otherwise, display a clear "Invalid Credentials" alert and lock access.

​Product Management Dashboard:

​Add Products: Form allowing title, category selection (Men/Women/Kids), price, description, sizes, and direct image upload from local system gallery.

​Manage Inventory: Options to edit prices, update stock status (In Stock / Out of Stock), or delete products.

​Orders Tracking Section:

​Dedicated "Orders" tab storing every order placed by customers with full buyer details, product breakdown, total bill, timestamp, and order status (Pending / Shipped / Delivered).

​Technical Requirements:

​Write clean, fully functional, modular code using modern frontend frameworks (React/Vue/HTML5/Tailwind CSS) with state management for cart/admin sync.

​Implement local Storage or backend simulation so product additions, reviews, and placed orders persist seamlessly across page refreshes.

​Ensure 100% bug-free routing, seamless state management, and mobile responsiveness.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://remo-collections.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e0e7a974-e4a5-47d1-9198-189735051ef0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
