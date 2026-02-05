<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; // ✅ Import Interface
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserStatusChanged extends Mailable implements ShouldQueue // ✅ Implement Interface
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;

        // ✅ Send to Horizon's specific 'emails' queue
        $this->onQueue('emails');
    }

    public function build()
    {
        $status = $this->user->is_active ? 'Activated' : 'Deactivated';

        return $this->subject("Account Status: $status")
                    ->view('emails.universal')
                    ->with([
                        'title' => 'Status Change',
                        'type' => 'status',
                        'message_intro' => 'Your account status has been updated.',
                    ]);
    }
}
