# Entrada web (React Native Web)

Expo (con Metro bundler) compila `client/index.js` hacia la web con
`react-native-web`; no se necesita un entry HTML custom.

Para arrancar el panel web:

```bash
npm run dev:web --workspace=client
```

Si en el futuro se migra a un bundler webpack/vite custom, el entry
declarado aquí sería el punto de arranque. La URL de la API se configura
con la variable `EXPO_PUBLIC_API_URL`.
