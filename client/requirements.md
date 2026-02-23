## Packages
recharts | Beautiful, responsive charts for the dashboard
date-fns | Date formatting and manipulation for renewal dates
framer-motion | Smooth page transitions and component animations
lucide-react | Icons for the interface
react-hook-form | Form state management
@hookform/resolvers | Zod validation integration for forms

## Notes
- `price` for subscriptions is stored in cents in the database. The frontend must convert dollars to cents before sending to the API, and convert cents to dollars when displaying.
- Free plan limit is enforced by the backend (max 5 subscriptions). The frontend should handle 403 errors gracefully by prompting the user to upgrade.
- Assume dark mode by default.
- Use `Outfit` for display fonts and `DM Sans` for body fonts.
