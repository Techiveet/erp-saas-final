<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'User Report' }}</title>
    <style>
        body { font-family: sans-serif; font-size: 10px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
        .header p { margin: 5px 0 0; font-size: 10px; color: #666; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: middle; }
        th { background-color: #f4f4f4; font-weight: bold; text-transform: uppercase; font-size: 9px; }
        tr:nth-child(even) { background-color: #fafafa; }

        .status-active { color: green; font-weight: bold; }
        .status-inactive { color: red; font-weight: bold; }
        .center-text { text-align: center; }
    </style>
</head>
<body>

    <div class="header">
        <h2>{{ $title ?? 'User Report' }}</h2>
        <p>Generated on: {{ now()->format('Y-m-d H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th width="5%" class="center-text">#</th>
                <th width="25%">User</th>
                <th width="25%">Email</th>
                <th width="15%">Role</th>
                <th width="10%">Status</th>
                <th width="20%">Joined</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $row)
                <tr>
                    <td class="center-text">{{ $loop->iteration }}</td>

                    <td><b>{{ $row->name }}</b></td>
                    <td>{{ $row->email }}</td>
                    <td>{{ optional($row->roles->first())->name ?? 'Member' }}</td>
                    <td>
                        <span class="{{ $row->is_active ? 'status-active' : 'status-inactive' }}">
                            {{ $row->is_active ? 'Active' : 'Inactive' }}
                        </span>
                    </td>
                    <td>{{ optional($row->created_at)->format('Y-m-d') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">No records found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>
