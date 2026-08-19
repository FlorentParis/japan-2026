/**
 * Configuration dédiée aux scripts qui tournent sous Node (`npm run qa`,
 * `npm run photos`).
 *
 * Elle les empaquette pour Node afin qu'ils importent le vrai code du site
 * (données, sélecteurs, composants) plutôt que d'en recopier une version
 * simplifiée : sinon les contrôles ne prouveraient rien, et le générateur de
 * photos aurait sa propre liste d'activités à garder synchronisée à la main.
 */
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: '.qa',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        donnees: 'scripts/qa-donnees.ts',
        rendu: 'scripts/qa-rendu.tsx',
        photos: 'scripts/fetch-photos.ts',
      },
      output: { entryFileNames: '[name].mjs' },
    },
  },
})
