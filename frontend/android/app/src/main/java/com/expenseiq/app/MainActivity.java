package com.expenseiq.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity.java
 *
 * File location: android/app/src/main/java/com/expenseiq/app/MainActivity.java
 *
 * REPLACE your existing MainActivity.java with this.
 * The only change from the Capacitor default is registering SmsPlugin.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register our custom SMS plugin BEFORE super.onCreate
        registerPlugin(SmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
