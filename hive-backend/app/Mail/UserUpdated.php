<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; // ✅ Import Interface
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserUpdated extends Mailable implements ShouldQueue // ✅ Implement Interface
{
    use Queueable, SerializesModels;

    public $user;
    public $changes;

    public function __construct(User $user, array $changes = [])
    {
        $this->user = $user;
        $this->changes = $changes;

        // ✅ Send to Horizon's specific 'emails' queue
        $this->onQueue('emails');
    }

    public function build()
    {
        return $this->subject('Profile Update Notification')
                    ->view('emails.universal')
                    ->with([
                        'title' => 'Profile Updated',
                        'type' => 'updated',
                        'message_intro' => 'We wanted to let you know that your account details have been modified.',
                    ]);
    }
}
