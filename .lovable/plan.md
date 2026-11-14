# Faster product listings

## What will change
- Fetch products in 16-row pages with an explicit lightweight column list; request reviews only for products in the page, and append later pages only when shoppers ask for more.
- Add clear loading skeletons on home, category, and search listings, plus a load-more control that preserves existing filtering and sorting.
- Keep product images lazy-loaded and reduce newly uploaded product images to smaller, web-friendly JPEGs.
- Preserve product details, cart, and admin behavior when products are outside the first page by loading them as needed or by paging through the admin list.

## Technical notes
- Keep the existing shared store and database access patterns; avoid adding a server function or a new backend dependency.
- Treat current visitor speed readings as directional only: the home page has fewer than 30 readings, so its p75 is not enough to establish a reliable real-visitor baseline.
