package com.expenseiq.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.telephony.SmsMessage;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * SmsPlugin — Capacitor native plugin for Android SMS
 *
 * File location in your project:
 *   android/app/src/main/java/com/expenseiq/app/SmsPlugin.java
 *
 * Provides:
 *   getMessages({ since })     → reads inbox from a timestamp
 *   smsReceived event          → fires when a new SMS arrives
 */
@CapacitorPlugin(
    name = "SmsPlugin",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_SMS },    alias = "readSms"),
        @Permission(strings = { Manifest.permission.RECEIVE_SMS }, alias = "receiveSms"),
    }
)
public class SmsPlugin extends Plugin {

    private BroadcastReceiver smsReceiver;

    // ── getMessages ──────────────────────────────────────────────────────────
    @PluginMethod
    public void getMessages(PluginCall call) {
        if (getPermissionState("readSms") != PermissionState.GRANTED) {
            call.reject("READ_SMS permission not granted");
            return;
        }

        long since = call.getLong("since", 0L);

        ContentResolver cr = getContext().getContentResolver();
        Cursor cursor = cr.query(
            Uri.parse("content://sms"),
            new String[]{"address", "body", "date", "type"},
            "date > ? AND type = 1",
            new String[]{String.valueOf(since)},
            "date DESC"
        );

        JSArray messages = new JSArray();

        if (cursor != null) {
            while (cursor.moveToNext()) {
                JSObject msg = new JSObject();
                String address = cursor.getString(cursor.getColumnIndexOrThrow("address"));
                String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));
                if (address == null) address = "";
                if (body == null) body = "";

                msg.put("address", address);
                msg.put("body", body);
                msg.put("date",    cursor.getLong(cursor.getColumnIndexOrThrow("date")));
                messages.put(msg);
            }
            cursor.close();
        }

        JSObject result = new JSObject();
        result.put("messages", messages);
        call.resolve(result);
    }

    // ── Start listening for incoming SMS ─────────────────────────────────────
    @Override
    protected void handleOnStart() {
        super.handleOnStart();
        startSmsListener();
    }

    @Override
    protected void handleOnStop() {
        super.handleOnStop();
        stopSmsListener();
    }

    private void startSmsListener() {
        if (smsReceiver != null) return;

        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) return;

                Bundle bundle = intent.getExtras();
                if (bundle == null) return;

                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus == null) return;

                for (Object pdu : pdus) {
                    SmsMessage smsMsg = SmsMessage.createFromPdu((byte[]) pdu);
                    if (smsMsg == null) continue;

                    JSObject event = new JSObject();
                    event.put("address", smsMsg.getDisplayOriginatingAddress());
                    event.put("body",    smsMsg.getDisplayMessageBody());
                    event.put("date",    System.currentTimeMillis());

                    // Fire the JS event
                    notifyListeners("smsReceived", event);
                }
            }
        };

        IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
        filter.setPriority(999);
        getContext().registerReceiver(smsReceiver, filter);
    }

    private void stopSmsListener() {
        if (smsReceiver != null) {
            try { getContext().unregisterReceiver(smsReceiver); } catch (Exception ignored) {}
            smsReceiver = null;
        }
    }
}
