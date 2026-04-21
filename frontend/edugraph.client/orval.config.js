module.exports = {
    webApi: {
        // URL или путь к локальному swagger.json
        input: 'http://localhost:5074/swagger/v1/swagger.json',
        output: {
            mode: 'tags-split', // Разделяет файлы по контроллерам ASP.NET
            target: 'src/api/endpoints', // Куда сохранять хуки
            schemas: 'src/api/models', // Куда сохранять TS-интерфейсы
            client: 'react-query', // Генерировать хуки для TanStack Query
            mock: false,
            clean: true,
        },
    },
};