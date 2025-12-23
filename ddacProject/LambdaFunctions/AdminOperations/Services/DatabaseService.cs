using MySql.Data.MySqlClient;
using System.Text.Json;

namespace AdminOperations.Services;

public class DatabaseService
{
    private readonly string _connectionString;

    public DatabaseService()
    {
        _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING") 
            ?? "Server=localhost;Database=propertymanagementdb;User=root;Password=;Port=3306;";
    }

    public MySqlConnection GetConnection()
    {
        return new MySqlConnection(_connectionString);
    }

    public async Task<T?> ExecuteScalarAsync<T>(string query, params MySqlParameter[] parameters)
    {
        using var connection = GetConnection();
        await connection.OpenAsync();
        
        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddRange(parameters);
        
        var result = await command.ExecuteScalarAsync();
        return result != null && result != DBNull.Value ? (T)Convert.ChangeType(result, typeof(T)) : default;
    }

    public async Task<int> ExecuteNonQueryAsync(string query, params MySqlParameter[] parameters)
    {
        using var connection = GetConnection();
        await connection.OpenAsync();
        
        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddRange(parameters);
        
        return await command.ExecuteNonQueryAsync();
    }

    public async Task<List<Dictionary<string, object>>> ExecuteReaderAsync(string query, params MySqlParameter[] parameters)
    {
        var results = new List<Dictionary<string, object>>();
        
        using var connection = GetConnection();
        await connection.OpenAsync();
        
        using var command = new MySqlCommand(query, connection);
        command.Parameters.AddRange(parameters);
        
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null! : reader.GetValue(i);
            }
            results.Add(row);
        }
        
        return results;
    }

    public async Task LogAuditAsync(int userId, string actionType, string tableName, string? oldValues, string? newValues)
    {
        var query = @"INSERT INTO AuditLogs (UserId, ActionType, TableName, OldValues, NewValues, Timestamp) 
                      VALUES (@userId, @actionType, @tableName, @oldValues, @newValues, @timestamp)";

        await ExecuteNonQueryAsync(query,
            new MySqlParameter("@userId", userId),
            new MySqlParameter("@actionType", actionType),
            new MySqlParameter("@tableName", tableName),
            new MySqlParameter("@oldValues", oldValues ?? (object)DBNull.Value),
            new MySqlParameter("@newValues", newValues ?? (object)DBNull.Value),
            new MySqlParameter("@timestamp", DateTime.UtcNow)
        );
    }
}
