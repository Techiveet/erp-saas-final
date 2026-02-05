<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; // ✅ Import Interface
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserCreated extends Mailable implements ShouldQueue // ✅ Implement Interface
{
    use Queueable, SerializesModels;

    public $user;
    public $actionUrl;

    public function __construct(User $user, string $actionUrl)
    {
        $this->user = $user;
        $this->actionUrl = $actionUrl;

        // ✅ Send to Horizon's specific 'emails' queue
        $this->onQueue('emails');
    }

    public function build()
    {
        return $this->subject('Welcome to Hive ERP - Activate Your Account')
                    ->view('emails.universal')
                    ->with([
                        'title' => 'Activate Account',
                        'type' => 'created',
                        'message_intro' => 'Your account has been provisioned. To access the neural network, you must establish your secure credentials.',
                    ]);
    }
}
