# Run local development

```bash
make dev # to start necessary containers (postgres, temporal, temporal-ui)

PORT=3030 npm run dev # to start app on PORT 3030
```

```bash
npx knex migrate:make name
```
