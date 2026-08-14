package com.localsite.optimizer;

import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import android.database.Cursor;

import org.json.JSONArray;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;

@CapacitorPlugin(
    name = "BrowserHistory",
    permissions = {
        @Permission(strings = { "com.android.browser.permission.READ_HISTORY_BOOKMARKS" }, alias = "history")
    }
)
public class BrowserHistoryPlugin extends Plugin {

    private static final Uri BOOKMARKS_URI = Uri.parse("content://browser/bookmarks");
    private static final String COLUMN_TITLE = "title";
    private static final String COLUMN_URL = "url";
    private static final String COLUMN_DATE = "date";
    private static final String COLUMN_BOOKMARK = "bookmark";

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("history") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("history", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("history") == com.getcapacitor.PermissionState.GRANTED);
        call.resolve(result);
    }

    @PluginMethod
    public void getRecent(PluginCall call) {
        if (getPermissionState("history") != com.getcapacitor.PermissionState.GRANTED) {
            call.reject("Browser history permission not granted");
            return;
        }

        int limit = call.getInt("limit", 100);
        JSONArray entries = new JSONArray();
        Set<String> seen = new HashSet<>();

        try {
            String[] projection = new String[] {
                COLUMN_TITLE,
                COLUMN_URL,
                COLUMN_DATE,
                COLUMN_BOOKMARK
            };
            String selection = COLUMN_BOOKMARK + " = 0";
            String sortOrder = COLUMN_DATE + " DESC";

            Cursor cursor = getContext().getContentResolver().query(BOOKMARKS_URI, projection, selection, null, sortOrder);
            if (cursor != null) {
                int titleIndex = cursor.getColumnIndex(COLUMN_TITLE);
                int urlIndex = cursor.getColumnIndex(COLUMN_URL);
                int dateIndex = cursor.getColumnIndex(COLUMN_DATE);

                while (cursor.moveToNext() && entries.length() < limit) {
                    String url = cursor.getString(urlIndex);
                    if (url == null || !url.startsWith("http")) {
                        continue;
                    }
                    String hostKey = Uri.parse(url).getHost();
                    if (hostKey == null || seen.contains(hostKey)) {
                        continue;
                    }
                    seen.add(hostKey);

                    JSObject entry = new JSObject();
                    entry.put("url", url);
                    entry.put("title", cursor.getString(titleIndex));
                    long visitedAtMs = cursor.getLong(dateIndex);
                    if (visitedAtMs > 0) {
                        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                        format.setTimeZone(TimeZone.getTimeZone("UTC"));
                        entry.put("visitedAt", format.format(new Date(visitedAtMs)));
                    } else {
                        entry.put("visitedAt", null);
                    }
                    entries.put(entry);
                }
                cursor.close();
            }
        } catch (Exception error) {
            call.reject("Failed to read browser history: " + error.getMessage());
            return;
        }

        JSObject result = new JSObject();
        result.put("entries", entries);
        call.resolve(result);
    }
}
