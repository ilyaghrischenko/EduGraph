namespace EduGraph.Infrastructure.SQLite.Exceptions;

public sealed class DatabaseException(string message) : Exception(message);
