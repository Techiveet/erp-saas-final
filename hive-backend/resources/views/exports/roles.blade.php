<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif; /* Best for UTF-8 support */
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <p>Generated: {{ now()->format('F j, Y, g:i a') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th width="5%">#</th>
                <th width="25%">Role Name</th>
                <th width="50%">Permissions</th>
                <th width="20%">Created</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $index => $row)
            <tr>
                <td>{{ $loop->iteration }}</td>
                <td><strong>{{ $row['name'] }}</strong></td>
                <td>
                    {{ $row['permissions'] ?: 'No permissions assigned' }}
                </td>
                <td>{{ $row['created_at'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
