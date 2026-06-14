<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ThresholdBreachedNotification extends Notification
{
    protected $alert;
    protected $source;
    protected $threshold;
    protected $currentValue;
    protected $parameterName;
    
    public function __construct($alert, $source, $threshold, $currentValue, $parameterName)
    {
        $this->alert = $alert;
        $this->source = $source;
        $this->threshold = $threshold;
        $this->currentValue = $currentValue;
        $this->parameterName = $parameterName;
    }
    
    public function via($notifiable): array
    {
        // Only send via email - don't use database channel
        if ($this->threshold->severity === 'critical') {
            return ['mail'];
        }
        
        // For non-critical, could add other channels here if needed
        return [];
    }
    
    public function toMail($notifiable): MailMessage
    {
        $sourceName = $this->source instanceof \App\Models\MonitoringStation 
            ? $this->source->station_name 
            : $this->source->site_name;
            
        $operator = $this->threshold->min_value !== null ? 'below' : 'above';
        $limit = $this->threshold->min_value ?? $this->threshold->max_value;
        
        return (new MailMessage)
            ->subject("URGENT: {$this->threshold->severity} Threshold Breach - {$this->parameterName}")
            ->greeting("Alert for {$sourceName}")
            ->line("A {$this->threshold->severity} threshold has been breached for parameter: **{$this->parameterName}**")
            ->line("Current value: **{$this->currentValue}**")
            ->line("Threshold limit: **{$operator} {$limit}**")
            ->action('View Alert', url("/alerts/{$this->alert->id}"))
            ->line('Please investigate and take appropriate action immediately.');
    }
}