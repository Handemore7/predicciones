Simulacion de resultados de distintas ligas al rededor del mundo

## Aplicación "Hola Mundo" (fase inicial)

Sitio estático mínimo que muestra el texto centrado "hola mundo". Servirá como base para evolucionar la app de predicciones.

### Archivos clave

- `index.html`: Página principal.
- `styles.css`: Estilos.
- `netlify.toml`: Config para despliegue en Netlify.

### Ejecutar localmente

Abrir `index.html` directamente o levantar un servidor simple:

```bash
python -m http.server 8000
# Visita http://localhost:8000
```

### Deploy en GitHub Pages (branch main)

1. Commit & push:
	```bash
	git add .
	git commit -m "feat: hola mundo inicial"
	git push origin main
	```
2. En GitHub: Settings > Pages.
3. Source: `Deploy from a branch`.
4. Branch: `main` y raíz (`/`). Guarda.
5. Espera la publicación: `https://<usuario>.github.io/predicciones/`.

### Deploy en Netlify

1. Crea cuenta / inicia sesión en https://app.netlify.com/
2. New Site > Import from Git.
3. Conecta GitHub y selecciona el repo.
4. Build command: (vacío). Publish directory: `.`
5. Deploy.
6. Obtienes URL tipo `https://<random>.netlify.app` (puedes renombrar el sitio).

Alternativa rápida: arrastra la carpeta (o zip) al panel de sitios en Netlify.

### Próximos pasos sugeridos

- Añadir lógica de simulación real.
- Integrar framework (React/Vite o Svelte) si crece la UI.
- Configurar CI/CD (GitHub Actions) para despliegues automáticos.
- Añadir pruebas y métricas (Lighthouse, accesibilidad).

---

Pídeme si quieres que haga el commit y push automáticamente desde aquí.
