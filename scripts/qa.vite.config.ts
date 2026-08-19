/**
 * Configuration dédiée aux contrôles de qualité (`npm run qa`).
 *
 * Elle empaquette les deux scripts de vérification pour Node : ils importent le
 * vrai code du site (données, sélecteurs, composants) plutôt que d'en recopier
 * une version simplifiée, sinon les contrôles ne prouveraient rien.
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
      },
      output: { entryFileNames: '[name].mjs' },
    },
  },
})
