var builder = DistributedApplication.CreateBuilder(args);

string pythonAppDirectory = Path.GetFullPath("../../../../vector-search/EduGraph.VectorSearch");
string certifiPath = Directory
    .GetFiles(
        Path.Combine(pythonAppDirectory, ".venv/lib"),
        "cacert.pem",
        SearchOption.AllDirectories)
#pragma warning disable CA1307
    .First(path => path.Contains("certifi"));
#pragma warning restore CA1307

var vectorSearchApi = builder
    .AddExecutable(
        name: "vector-search-api",
        command: ".venv/bin/opentelemetry-instrument",
        workingDirectory: pythonAppDirectory,
        args:
        [
            ".venv/bin/python",
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000"
        ])
    .WithHttpEndpoint(targetPort: 8000, name: "http")
    .WithOtlpExporter()
    .WithEnvironment("OTEL_SERVICE_NAME", "vector-search-api")
    .WithEnvironment("OTEL_TRACES_EXPORTER", "otlp")
    .WithEnvironment("OTEL_METRICS_EXPORTER", "otlp")
    .WithEnvironment("OTEL_LOGS_EXPORTER", "otlp")
    .WithEnvironment("OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED", "true")
    .WithEnvironment("SSL_CERT_FILE", certifiPath)
    .WithEnvironment("REQUESTS_CA_BUNDLE", certifiPath)
    .WithEnvironment("CURL_CA_BUNDLE", certifiPath);

var api = builder
    .AddProject<Projects.EduGraph_Core>("api")
    .WithEnvironment("VectorSearch__BaseUrl", vectorSearchApi.GetEndpoint("http"))
    .WaitFor(vectorSearchApi);

var frontend = builder
    .AddViteApp(
        name: "frontend",
        appDirectory: "../../../../../frontend/edugraph.client")
    .WithReference(api)
    .WaitFor(api)
    .WithNpm()
    .WithExternalHttpEndpoints();

api.WithReference(frontend);

builder.Build().Run();
