# Carga masiva de residentes

Objetivo:
Importar residentes y contactos desde CSV sin exponer datos sensibles en la app de porteria.

## Endpoint

Ruta:

```text
POST /api/admin/import/residents
```

Requiere token de administrador en el encabezado:

```text
Authorization: Bearer TOKEN_ADMIN
```

## Columnas soportadas

El CSV debe tener encabezados. Se aceptan nombres en espanol o ingles.

Columnas obligatorias:

- `bloque`
- `apartamento`
- `nombre`

Columnas opcionales:

- `documento`
- `telefono`
- `email`
- `tipo`

Ejemplo:

```csv
bloque,apartamento,nombre,documento,telefono,email,tipo
35,1C,Andres Gomez,123456789,3148337748,andres@example.com,resident
35,1D,Residente Prueba,987654321,+573001112233,residente@example.com,owner
```

## Prueba seca

Para validar el archivo sin guardar cambios, enviar:

```json
{
  "dryRun": true,
  "csv": "bloque,apartamento,nombre,documento,telefono\n35,1C,Andres Gomez,123456789,3148337748"
}
```

Respuesta esperada:

```json
{
  "dryRun": true,
  "parsedRows": 1,
  "errors": [],
  "sample": []
}
```

## Carga real

Para guardar cambios, enviar el mismo contenido sin `dryRun`:

```json
{
  "csv": "bloque,apartamento,nombre,documento,telefono\n35,1C,Andres Gomez,123456789,3148337748"
}
```

La API:

- Busca la unidad existente por bloque y apartamento.
- Crea el residente si no existe por documento dentro de esa unidad.
- Actualiza nombre, email y tipo si el residente ya existe.
- Crea o actualiza el contacto principal.
- Normaliza telefonos colombianos de 10 digitos a formato `+57`.
- Registra auditoria administrativa.

## Reglas de seguridad

- Solo usuarios `admin` o `superadmin` pueden importar.
- No se crean apartamentos nuevos desde esta ruta.
- Las filas con errores se omiten y se reportan en `skippedRows`.
- La carga maxima por solicitud es de 1000 filas.
