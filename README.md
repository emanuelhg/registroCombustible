# Registro de Consumo de Combustible

Aplicación web para registrar recargas, calcular consumo (`L/100 km`) y analizar la evolución del rendimiento del vehículo.

## Estado actual

- Interfaz modernizada y responsive (desktop + mobile).
- Persistencia local con `localStorage` (datos guardados en el navegador).
- Tabla interactiva con DataTables (búsqueda, paginación y ordenamiento).

## Funcionalidades

- Alta de registros con:
  - Provincia, ciudad, bandera y estación (con catálogo local)
  - Tipo de combustible
  - Kilómetros desde la última recarga
  - Litros cargados
  - Precio por litro y/o gasto total
  - Fecha de recarga
- Validaciones de formulario (valores numéricos > 0 y fecha válida).
- Autocompletado/sugerencia de precio vigente por estación+combustible (fuente: datos.energia.gob.ar).
- Edición de registros existentes.
- Borrado individual y borrado total con confirmación.
- KPIs visibles:
  - Consumo promedio
  - Recorrido promedio
  - Carga promedio
- Modal de promedios con gráfico de tendencia (Chart.js) y escala dinámica.
- Exportación de datos a JSON.
- Importación de JSON con validación y normalización de registros.

## Flujo de uso

1. Completar kilómetros, litros y fecha.
2. Presionar **Agregar registro**.
3. Revisar historial en la tabla y usar **Editar** o **Borrar** según necesidad.
4. Usar **Promedios y gráfico** para ver métricas y tendencia.
5. Usar **Exportar JSON** y **Importar JSON** para backup/restauración.

## Tecnologías

- HTML5
- CSS3
- JavaScript (jQuery)
- Bootstrap 5
- DataTables
- Chart.js
- Font Awesome

## Catalogo de estaciones y precios

La app usa un catalogo estatico versionado en el repo:

- `stations-catalog.json`: snapshot principal (estaciones + timeline de precios por marca).
- `stations-catalog.js`: version consumida por el frontend.

Para actualizar estos archivos existe el script:

```bash
node scripts/update-stations.mjs
```

El script soporta fuentes remotas opcionales por variables de entorno:

- `OFFICIAL_CSV_URL` o `VIGENTES_CSV_URL` (CSV oficial de precios vigentes)
- `HISTORICAL_CSV_URL` (CSV histórico alternativo)
- `STATIONS_SOURCE_URL`
- `PRICES_SOURCE_URL`
- `TIMELINE_MONTHS` (default `18`, ventana de meses para timeline)
- `RECENCY_DAYS` (default `45`, ventana reciente para sugerencia local/marca)

Si falla la descarga o no existen variables, genera el catalogo con un seed local de respaldo.

## Actualizacion automatica en GitHub Pages

Se incluye workflow en `.github/workflows/update-catalog.yml`:

- Corre diariamente por `cron`.
- Corre también en `push` a `main` cuando cambian workflow/script/catálogo.
- Se puede disparar manualmente con `workflow_dispatch`.
- Si detecta cambios en catalogo, hace commit y push automatico.

Regla de sugerencia de precio:

1. Referencia local reciente por `provincia+ciudad+bandera+combustible`.
2. Fallback reciente por `bandera+combustible` (nacional).
3. Fallback legacy por timeline de marca si no hay referencia reciente.

Opcional: configurar en GitHub Secrets:

- `HISTORICAL_CSV_URL`
- `VIGENTES_CSV_URL` o `OFFICIAL_CSV_URL`
- `STATIONS_SOURCE_URL`
- `PRICES_SOURCE_URL`

Si no los configurás, el workflow sigue funcionando con seed local.

## Ejecución local

1. Clonar repositorio:

```bash
git clone https://github.com/emanuelhg/registroCombustible.git
```

2. Abrir `index.html` en el navegador.

## Notas

- No requiere backend.
- Los datos son locales al navegador/dispositivo actual.
- Para compartir datos entre dispositivos, exportar/importar JSON.
