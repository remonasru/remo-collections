<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture Rules
- Use manifest-only metadata for app installation; add app-shell service workers only when offline use is explicitly requested, because installed-app support does not require offline caching.
- Keep admin catalog edits staged until the existing global Save Changes action commits them, so staff can review or discard a complete draft before publishing.
