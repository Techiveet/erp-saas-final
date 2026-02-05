<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
    <title>{{ $subject ?? 'Hive System Transmission' }}</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">

    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@500;700&display=swap');
    </style>

    <style type="text/css">
        /* RESET STYLES */
        body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #050505 !important; color: #ffffff !important; }
        table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

        /* FONTS & COLORS */
        .font-grotesk { font-family: 'Space Grotesk', Helvetica, Arial, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; }
        .font-sans { font-family: 'Inter', Helvetica, Arial, sans-serif; }

        .text-gold { color: #ffb700 !important; }
        .text-mute { color: #9ca3af !important; }
        .bg-armor { background-color: #0e0e10 !important; }
        .bg-void { background-color: #050505 !important; }

        /* LAYOUT */
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #050505;
            /* Subtle Grid Pattern */
            background-image: linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px);
            background-size: 20px 20px;
            padding-bottom: 60px;
        }
        .main-table {
            background-color: #0e0e10;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border: 1px solid #1a1a1d;
            border-top: 3px solid #ffb700;
            box-shadow: 0 10px 50px -10px rgba(0,0,0,0.8);
        }

        /* COMPONENTS */
        .header { padding: 40px 0 20px 0; text-align: center; }
        .content { padding: 0 40px 40px 40px; }

        .info-card {
            background-color: #1a1a1d;
            border: 1px solid #333;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .data-row { border-bottom: 1px solid #2a2a2d; padding: 12px 0; }
        .data-row:last-child { border-bottom: none; }
        .data-label { color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .data-value { color: #ffffff; font-weight: 600; font-size: 13px; text-align: right; }

        /* HIVE BUTTON */
        .btn-hive {
            background-color: #ffb700;
            color: #050505;
            padding: 14px 32px;
            text-decoration: none;
            display: inline-block;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 14px;
            border: 2px solid #ffb700;
            border-radius: 2px;
        }
        .btn-hive:hover { background-color: #ffffff; color: #000000; border-color: #ffffff; }

        /* STATUS BADGE */
        .status-badge {
            background-color: rgba(255, 183, 0, 0.05);
            border: 1px solid #333;
            color: #ffb700;
            padding: 8px 20px;
            display: inline-block;
            font-size: 12px;
            letter-spacing: 2px;
            font-weight: bold;
        }
        .status-active { color: #10b981; border-color: rgba(16, 185, 129, 0.3); background-color: rgba(16, 185, 129, 0.05); }
        .status-inactive { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background-color: rgba(239, 68, 68, 0.05); }

        /* FOOTER */
        .footer { text-align: center; padding: 30px; color: #555; font-size: 12px; border-top: 1px solid #1a1a1d; background-color: #0a0a0a; }
        .footer a { color: #777; text-decoration: none; margin: 0 10px; }
        .footer a:hover { color: #ffb700; }

        .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
    </style>

    </head>
<body class="bg-void font-sans">

    <div class="preheader">
        {{ substr(strip_tags($message_intro), 0, 100) }}... // HIVE_ERP_SYSTEM_LOG
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>

    <table class="wrapper" role="presentation" border="0" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table height="40"><tr><td></td></tr></table>

                <table class="main-table" role="presentation" border="0" cellpadding="0" cellspacing="0">

                    <tr>
                        <td class="header">
                            <div class="font-grotesk" style="font-size: 28px; font-weight: 700; letter-spacing: -2px;">
                                <span style="color: #ffb700;">HIVE</span>.OS
                            </div>
                            <div class="font-mono" style="font-size: 10px; color: #555; letter-spacing: 2px; margin-top: 8px;">
                                [SECURE_TRANSMISSION :: ENCRYPTED]
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td class="content">

                            <h1 class="font-grotesk" style="font-size: 24px; margin: 0 0 15px 0; color: #ffffff; font-weight: 700;">
                                {{ $title }}
                            </h1>
                            <p class="font-sans text-mute" style="margin: 0 0 25px 0; line-height: 1.6; font-size: 15px;">
                                Greetings Node <strong>{{ $user->name }}</strong>,<br><br>
                                {{ $message_intro }}
                            </p>

                            @if($type === 'created')
                                <div class="info-card font-mono">
                                    <div style="color: #ffb700; font-size: 11px; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px;">
                                        > PENDING_ACTIVATION
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 11px;">USER_ID:</span><br>
                                        <span style="color: #fff; font-size: 14px;">{{ $user->email }}</span>
                                    </div>
                                    <div>
                                        <span style="color: #666; font-size: 11px;">ACTION_REQUIRED:</span><br>
                                        <span style="color: #9ca3af; font-size: 13px;">Establish secure credentials to initialize node access.</span>
                                    </div>
                                </div>

                                <div style="text-align: center; margin-top: 35px; margin-bottom: 30px;">
                                    <a href="{{ $actionUrl ?? '#' }}" class="btn-hive font-grotesk">
                                        Set Secure Password
                                    </a>
                                </div>

                                <p class="font-mono" style="font-size: 10px; color: #666; text-align: center;">
                                    // LINK_EXPIRATION: This secure link expires in 60 minutes.
                                </p>
                            @endif

                            @if($type === 'status')
                                <div style="text-align: center; margin: 40px 0;">
                                    <div class="status-badge font-mono {{ $user->is_active ? 'status-active' : 'status-inactive' }}">
                                        NODE STATUS: {{ $user->is_active ? 'OPERATIONAL' : 'OFFLINE' }}
                                    </div>
                                </div>
                                <p class="text-mute font-sans" style="font-size: 14px; background: rgba(255,255,255,0.03); padding: 15px; border-left: 2px solid {{ $user->is_active ? '#10b981' : '#ef4444' }};">
                                    @if($user->is_active)
                                        > Connection restored. Re-syncing distributed ledger... [OK]
                                    @else
                                        > Neural link severed by Administrator. Access denied.
                                    @endif
                                </p>
                            @endif

                            @if($type === 'updated' && !empty($changes))
                                <div class="info-card">
                                    <div class="font-mono" style="color: #555; font-size: 10px; margin-bottom: 15px; letter-spacing: 1px;">
                                        > MODIFIED_PARAMETERS
                                    </div>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        @foreach($changes as $field => $newValue)
                                            <tr>
                                                <td class="data-row">
                                                    <span class="font-mono data-label">{{ strtoupper($field) }}</span>
                                                </td>
                                                <td class="data-row" style="text-align: right;">
                                                    <span class="font-sans data-value">{{ $newValue }}</span>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </table>
                                </div>
                            @elseif($type === 'updated')
                                <p class="text-mute">Your profile metrics have been updated within the central registry.</p>
                            @endif

                            @if($type !== 'created' && $user->is_active)
                                <div style="text-align: center; margin-top: 45px;">
                                    <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}" class="btn-hive font-grotesk">
                                        Open Dashboard
                                    </a>
                                </div>
                            @endif

                        </td>
                    </tr>

                    <tr>
                        <td class="footer font-mono">
                            <div style="margin-bottom: 20px; color: #ffb700; opacity: 0.7; font-size: 20px; letter-spacing: 5px;">
                                &#11042; &#8226; &#11042;
                            </div>

                            <p style="margin: 0 0 10px 0;">SYSTEM GENERATED LOG // {{ date('Y-m-d H:i:s') }}</p>

                            <div style="margin: 20px 0;">
                                <a href="#">Support</a> • <a href="#">Neural Docs</a> • <a href="#">Security</a>
                            </div>

                            <p style="margin: 0; opacity: 0.4; font-size: 10px;">&copy; {{ date('Y') }} HIVE NEURAL NETWORK. ALL NODES RESERVED.</p>
                        </td>
                    </tr>
                </table>

                <table height="40"><tr><td></td></tr></table>
            </td>
        </tr>
    </table>

</body>
</html>
