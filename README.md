# Registro de Consumo de Combustible

Aplicación web para registrar recargas, calcular consumo (`L/100 km`) y analizar la evolución del rendimiento del vehículo.

## Estado actual

- Interfaz modernizada y responsive (desktop + mobile).
- Persistencia local con `localStorage` (datos guardados en el navegador).
- Tabla interactiva con DataTables (búsqueda, paginación y ordenamiento).

## Funcionalidades

- Alta de registros con:
  - Kilómetros desde la última recarga
  - Litros cargados
  - Fecha de recarga
- Validaciones de formulario (valores numéricos > 0 y fecha válida).
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
