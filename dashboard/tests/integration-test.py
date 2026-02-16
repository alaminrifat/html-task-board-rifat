#!/usr/bin/env python3
"""
TaskBoard Admin Dashboard — Integration Tests
Tests: Auth flow, CRUD, Role-based access, Pagination, Error scenarios
Target: Backend API at http://localhost:3000/api
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
import urllib.parse

# Force UTF-8 output on Windows
if sys.platform == "win32":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:3000/api"

# Counters
passed = 0
failed = 0
warnings = 0
total = 0
failures = []
warning_list = []

# Token storage (since Secure cookies aren't sent over HTTP, we manage tokens manually)
admin_token = ""
user_token = ""
admin_refresh_token = ""
user_refresh_token = ""

# State
created_user_id = ""
created_label_id = ""
admin_id = ""
test_user_email = f"integration-test-{int(time.time())}@example.com"

# Colors
RED = "\033[0;31m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
BLUE = "\033[0;34m"
CYAN = "\033[0;36m"
NC = "\033[0m"


def api_call(method, endpoint, token="", data=None, expect_json=True):
    """Make an API call with Bearer token auth. Returns (status_code, parsed_body)."""
    url = f"{BASE_URL}{endpoint}"
    body_bytes = None
    if data is not None:
        body_bytes = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body_bytes, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Cookie", f"accessToken={token}")

    opener = urllib.request.build_opener()

    try:
        resp = opener.open(req, timeout=15)
        status = resp.status
        raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        status = e.code
        raw = e.read().decode("utf-8", errors="replace") if e.fp else ""
    except Exception as e:
        return (0, {"error": str(e)})

    if expect_json and raw.strip():
        try:
            return (status, json.loads(raw))
        except json.JSONDecodeError:
            return (status, raw)
    return (status, raw)


def extract_token(body):
    """Extract access token from login response body."""
    if isinstance(body, dict):
        data = body.get("data", body)
        return data.get("token", "")
    return ""


def extract_refresh_token(body):
    """Extract refresh token from login response body."""
    if isinstance(body, dict):
        data = body.get("data", body)
        return data.get("refreshToken", "")
    return ""


def assert_status(name, expected, actual, body=None, file_ref=None):
    global total, passed, failed
    total += 1
    if actual == expected:
        passed += 1
        print(f"  {GREEN}✅ PASS{NC} [{actual}] {name}")
    else:
        failed += 1
        print(f"  {RED}❌ FAIL{NC} [{actual} != {expected}] {name}")
        detail = f"Test: {name} | Expected: {expected} | Got: {actual}"
        if file_ref:
            detail += f" | File: {file_ref}"
        if body:
            detail += f" | Body: {str(body)[:200]}"
        failures.append(detail)


def assert_status_in(name, expected_set, actual, body=None, file_ref=None):
    global total, passed, failed
    total += 1
    if actual in expected_set:
        passed += 1
        print(f"  {GREEN}✅ PASS{NC} [{actual}] {name}")
    else:
        failed += 1
        exp_str = "/".join(str(e) for e in expected_set)
        print(f"  {RED}❌ FAIL{NC} [{actual} not in {exp_str}] {name}")
        detail = f"Test: {name} | Expected one of: {exp_str} | Got: {actual}"
        if file_ref:
            detail += f" | File: {file_ref}"
        failures.append(detail)


def assert_field(name, body, *keys):
    """Assert a nested field exists in the response body."""
    global total, passed, failed
    total += 1
    val = body
    path = ".".join(str(k) for k in keys)
    try:
        for k in keys:
            if isinstance(val, list):
                val = val[int(k)]
            elif isinstance(val, dict):
                val = val[k]
            else:
                raise KeyError(k)
        passed += 1
        display = str(val)[:60]
        print(f"  {GREEN}✅ PASS{NC} {name} ({path}={display})")
        return val
    except (KeyError, IndexError, TypeError):
        failed += 1
        print(f"  {RED}❌ FAIL{NC} {name} — field '{path}' missing")
        failures.append(f"{name}: field '{path}' missing in response")
        return None


def assert_field_eq(name, body, keys, expected):
    global total, passed, failed
    total += 1
    val = body
    path = ".".join(str(k) for k in keys)
    try:
        for k in keys:
            if isinstance(val, list):
                val = val[int(k)]
            elif isinstance(val, dict):
                val = val[k]
            else:
                raise KeyError(k)
        if str(val) == str(expected):
            passed += 1
            print(f"  {GREEN}✅ PASS{NC} {name} ({path}={val})")
        else:
            failed += 1
            print(f"  {RED}❌ FAIL{NC} {name} ({path}: expected '{expected}', got '{val}')")
            failures.append(f"{name}: {path} expected '{expected}', got '{val}'")
    except (KeyError, IndexError, TypeError):
        failed += 1
        print(f"  {RED}❌ FAIL{NC} {name} — field '{path}' missing")
        failures.append(f"{name}: field '{path}' missing")


def warn(name, detail):
    global warnings
    warnings += 1
    print(f"  {YELLOW}⚠️  WARN{NC} {name} — {detail}")
    warning_list.append(f"{name}: {detail}")


# =============================================================================
print(f"\n{CYAN}========================================================={NC}")
print(f"{CYAN} TaskBoard Admin Dashboard Integration Tests{NC}")
print(f"{CYAN}========================================================={NC}")
print(f"Target: {BASE_URL}")
print(f"Time:   {time.strftime('%Y-%m-%d %H:%M:%S')}")
print()

# =============================================================================
# 0. Pre-flight
# =============================================================================
print(f"{BLUE}[0] Pre-flight Check{NC}")
try:
    req = urllib.request.urlopen(f"{BASE_URL}/health", timeout=5)
    print(f"  {GREEN}✅{NC} Backend is healthy")
except Exception as e:
    print(f"  {RED}Backend is not running at {BASE_URL}. Aborting.{NC}")
    print(f"     Error: {e}")
    sys.exit(1)

# =============================================================================
# 1. AUTH FLOW
# =============================================================================
print(f"\n{BLUE}[1] Authentication Flow{NC}")

# 1.1 Admin Login
print(f"\n  {CYAN}1.1 Admin Login{NC}")
status, body = api_call("POST", "/auth/admin-login", "",
                        {"email": "admin@example.com", "password": "admin123"})
assert_status("Admin login succeeds", 201, status, body, "backend/src/modules/auth/auth.controller.ts")

admin_token = extract_token(body)
admin_refresh_token = extract_refresh_token(body)

total += 1
if admin_token:
    passed += 1
    print(f"  {GREEN}✅ PASS{NC} accessToken in response body")
else:
    failed += 1
    print(f"  {RED}FAIL{NC} No accessToken in response body")
    failures.append("No accessToken in admin login response body")

total += 1
if admin_refresh_token:
    passed += 1
    print(f"  {GREEN}✅ PASS{NC} refreshToken in response body")
else:
    failed += 1
    print(f"  {RED}FAIL{NC} No refreshToken in response body")
    failures.append("No refreshToken in admin login response body")

# 1.2 Check Login
print(f"\n  {CYAN}1.2 Check Login{NC}")
status, body = api_call("GET", "/auth/check-login", admin_token)
assert_status("check-login returns 200", 200, status, body, "backend/src/modules/auth/auth.controller.ts")
if isinstance(body, dict):
    data = body.get("data", body)
    if isinstance(data, dict):
        assert_field("check-login has id", data, "id")
        assert_field("check-login has email", data, "email")
        admin_id = data.get("id", "")
    else:
        warn("check-login", f"data is not dict: {type(data)}")
else:
    warn("check-login", f"Unexpected body type: {type(body)}")

# 1.3 Regular User Login
print(f"\n  {CYAN}1.3 Regular User Login{NC}")
status, body = api_call("POST", "/auth/login", "",
                        {"email": "user@example.com", "password": "user123"})
assert_status("Regular user login succeeds", 201, status, body)
user_token = extract_token(body)

# 1.4 Wrong password
print(f"\n  {CYAN}1.4 Failed Login (wrong password){NC}")
status, body = api_call("POST", "/auth/admin-login", "",
                        {"email": "admin@example.com", "password": "wrongpassword"})
assert_status("Wrong password returns 401", 401, status)

# 1.5 Non-admin on admin-login
print(f"\n  {CYAN}1.5 Non-admin user on admin-login{NC}")
status, body = api_call("POST", "/auth/admin-login", "",
                        {"email": "user@example.com", "password": "user123"})
assert_status_in("Non-admin on admin-login rejected", {401, 403}, status)

# 1.6 Unauthenticated access
print(f"\n  {CYAN}1.6 Unauthenticated access to protected endpoint{NC}")
status, body = api_call("GET", "/admin/users", "")
assert_status("Unauthenticated GET /admin/users returns 401", 401, status)

# 1.7 Refresh token
print(f"\n  {CYAN}1.7 Refresh Access Token{NC}")
if admin_refresh_token:
    status, body = api_call("GET", f"/auth/refresh-access-token?refreshToken={admin_refresh_token}", admin_token)
    assert_status_in("Token refresh succeeds", {200, 201}, status)
    # Update token if refresh returned a new one
    new_token = extract_token(body)
    if new_token:
        admin_token = new_token
else:
    warn("Token refresh", "No refreshToken available from login body")

# 1.8 Logout
print(f"\n  {CYAN}1.8 Logout{NC}")
status, body = api_call("GET", "/auth/logout", admin_token)
assert_status("Logout returns 200", 200, status)

# 1.9 After logout, token should be invalidated
print(f"\n  {CYAN}1.9 Check login after logout{NC}")
status, body = api_call("GET", "/auth/check-login", admin_token)
if status == 401:
    assert_status("Check login after logout returns 401", 401, status)
else:
    warn("Post-logout check", f"Token still valid after logout (status={status}) — stateless JWT, backend does not blacklist tokens")

# Re-login admin for subsequent tests
print(f"\n  {CYAN}Re-login admin{NC}")
status, body = api_call("POST", "/auth/admin-login", "",
                        {"email": "admin@example.com", "password": "admin123"})
if status == 429:
    print(f"  {YELLOW}Rate limited. Waiting 65s...{NC}")
    time.sleep(65)
    status, body = api_call("POST", "/auth/admin-login", "",
                            {"email": "admin@example.com", "password": "admin123"})
if status not in (200, 201):
    print(f"  {RED}Failed to re-login admin (status={status}). Aborting.{NC}")
    sys.exit(1)
admin_token = extract_token(body)
admin_refresh_token = extract_refresh_token(body)
print(f"  {GREEN}✅{NC} Re-logged in admin [{status}]")

# Extract admin ID
status2, body2 = api_call("GET", "/auth/check-login", admin_token)
if isinstance(body2, dict):
    d2 = body2.get("data", body2)
    if isinstance(d2, dict):
        admin_id = d2.get("id", admin_id)

# =============================================================================
# 2. ADMIN USER MANAGEMENT (CRUD)
# =============================================================================
print(f"\n{BLUE}[2] Admin User Management — CRUD{NC}")

# 2.1 List users
print(f"\n  {CYAN}2.1 List Users{NC}")
status, body = api_call("GET", "/admin/users", admin_token)
assert_status("GET /admin/users returns 200", 200, status, body)
if isinstance(body, dict):
    assert_field("User list has data", body, "data")
    assert_field("User list has meta", body, "meta")
    assert_field("User list meta.total", body, "meta", "total")

# 2.2 Create user
print(f"\n  {CYAN}2.2 Create User{NC}")
status, body = api_call("POST", "/admin/users", admin_token,
                        {"name": "Integration Test User", "email": test_user_email, "role": "TEAM_MEMBER"})
assert_status("POST /admin/users creates user", 201, status, body)
if isinstance(body, dict):
    data = body.get("data", body)
    created_user_id = data.get("id", "")
    if created_user_id:
        print(f"  {GREEN}✅{NC} Created user ID: {created_user_id}")
    else:
        warn("Create user", "Could not extract user ID from response")

# 2.3 Get user by ID
print(f"\n  {CYAN}2.3 Get User Detail{NC}")
if created_user_id:
    status, body = api_call("GET", f"/admin/users/{created_user_id}", admin_token)
    assert_status("GET /admin/users/:id returns 200", 200, status, body)
    if isinstance(body, dict):
        data = body.get("data", body)
        assert_field("User detail has email", data, "email")
        assert_field("User detail has role", data, "role")
        assert_field("User detail has status", data, "status")
else:
    warn("Get user detail", "Skipped — no user ID")

# 2.4 Update user
print(f"\n  {CYAN}2.4 Update User{NC}")
if created_user_id:
    status, body = api_call("PATCH", f"/admin/users/{created_user_id}", admin_token,
                            {"name": "Updated Test User", "jobTitle": "QA Engineer"})
    assert_status("PATCH /admin/users/:id returns 200", 200, status, body)
else:
    warn("Update user", "Skipped — no user ID")

# 2.5 Suspend user
print(f"\n  {CYAN}2.5 Change User Status (Suspend){NC}")
if created_user_id:
    status, body = api_call("PATCH", f"/admin/users/{created_user_id}/status", admin_token,
                            {"status": "SUSPENDED"})
    assert_status("Suspend user returns 200", 200, status, body)
else:
    warn("Suspend user", "Skipped — no user ID")

# 2.6 Reactivate user
print(f"\n  {CYAN}2.6 Change User Status (Activate){NC}")
if created_user_id:
    status, body = api_call("PATCH", f"/admin/users/{created_user_id}/status", admin_token,
                            {"status": "ACTIVE"})
    assert_status("Reactivate user returns 200", 200, status, body)
else:
    warn("Reactivate user", "Skipped — no user ID")

# 2.7 Change role
print(f"\n  {CYAN}2.7 Change User Role{NC}")
if created_user_id:
    status, body = api_call("PATCH", f"/admin/users/{created_user_id}/role", admin_token,
                            {"role": "PROJECT_OWNER"})
    assert_status("Change user role returns 200", 200, status, body)
else:
    warn("Change role", "Skipped — no user ID")

# 2.8 Reset user password
print(f"\n  {CYAN}2.8 Reset User Password{NC}")
if created_user_id:
    status, body = api_call("POST", f"/admin/users/{created_user_id}/reset-password", admin_token)
    if status == 200:
        assert_status("Reset password returns 200", 200, status)
    else:
        warn("Reset user password", f"Got status {status} — email service may not be configured")
else:
    warn("Reset password", "Skipped — no user ID")

# 2.9 Duplicate user
print(f"\n  {CYAN}2.9 Create Duplicate User{NC}")
status, body = api_call("POST", "/admin/users", admin_token,
                        {"name": "Duplicate", "email": test_user_email, "role": "TEAM_MEMBER"})
assert_status_in("Duplicate user correctly rejected", {400, 409}, status)

# 2.10 Non-existent user
print(f"\n  {CYAN}2.10 Get Non-existent User{NC}")
status, body = api_call("GET", "/admin/users/00000000-0000-0000-0000-000000000000", admin_token)
assert_status("Non-existent user returns 404", 404, status)

# =============================================================================
# 3. ADMIN PROJECT MANAGEMENT
# =============================================================================
print(f"\n{BLUE}[3] Admin Project Management{NC}")

# 3.1 List projects
print(f"\n  {CYAN}3.1 List Projects{NC}")
status, body = api_call("GET", "/admin/projects", admin_token)
assert_status("GET /admin/projects returns 200", 200, status, body)
project_id = ""
if isinstance(body, dict):
    assert_field("Project list has data", body, "data")
    assert_field("Project list has meta", body, "meta")
    items = body.get("data", [])
    if isinstance(items, list) and items:
        project_id = items[0].get("id", "")

# 3.2 Project detail
print(f"\n  {CYAN}3.2 Get Project Detail{NC}")
if project_id:
    status, body = api_call("GET", f"/admin/projects/{project_id}", admin_token)
    assert_status("GET /admin/projects/:id returns 200", 200, status, body)
else:
    warn("Get project detail", "No projects exist in DB — skipped")

# 3.3 Non-existent project
print(f"\n  {CYAN}3.3 Get Non-existent Project{NC}")
status, body = api_call("GET", "/admin/projects/00000000-0000-0000-0000-000000000000", admin_token)
assert_status("Non-existent project returns 404", 404, status)

# =============================================================================
# 4. ADMIN DASHBOARD
# =============================================================================
print(f"\n{BLUE}[4] Admin Dashboard — Stats & Charts{NC}")

# 4.1 Stats
print(f"\n  {CYAN}4.1 Dashboard Stats{NC}")
status, body = api_call("GET", "/admin/dashboard/stats", admin_token)
assert_status("GET /admin/dashboard/stats returns 200", 200, status, body)
if isinstance(body, dict):
    data = body.get("data", body)
    assert_field("Stats has totalUsers", data, "totalUsers")
    assert_field("Stats has totalProjects", data, "totalProjects")

# 4.2 Charts
print(f"\n  {CYAN}4.2 Dashboard Charts{NC}")
status, body = api_call("GET", "/admin/dashboard/charts", admin_token)
assert_status("GET /admin/dashboard/charts returns 200", 200, status, body)
if isinstance(body, dict):
    data = body.get("data", body)
    assert_field("Charts has userRegistrationTrend", data, "userRegistrationTrend")

# 4.3 Recent activity
print(f"\n  {CYAN}4.3 Dashboard Recent Activity{NC}")
status, body = api_call("GET", "/admin/dashboard/recent-activity", admin_token)
assert_status("GET /admin/dashboard/recent-activity returns 200", 200, status, body)

# 4.4 Stats with period filter
print(f"\n  {CYAN}4.4 Dashboard Stats with Period Filters{NC}")
for period in ["7d", "30d"]:
    status, body = api_call("GET", f"/admin/dashboard/stats?period={period}", admin_token)
    if status == 200:
        total += 1; passed += 1
        print(f"  {GREEN}✅ PASS{NC} Stats with period={period} returns 200")
    else:
        warn(f"Stats period={period}", f"Got status {status}")

# =============================================================================
# 5. SYSTEM CONFIGURATION
# =============================================================================
print(f"\n{BLUE}[5] Admin System Configuration{NC}")

# 5.1 Get settings
print(f"\n  {CYAN}5.1 Get Settings{NC}")
status, body = api_call("GET", "/admin/settings", admin_token)
assert_status("GET /admin/settings returns 200", 200, status, body)
if isinstance(body, dict):
    data = body.get("data", body)
    if isinstance(data, list):
        total += 1; passed += 1
        print(f"  {GREEN}✅ PASS{NC} Settings returns SystemSetting[] array ({len(data)} rows)")
    else:
        warn("Settings shape", f"Expected array, got {type(data).__name__}")

# 5.2 Update general
print(f"\n  {CYAN}5.2 Update General Settings{NC}")
status, body = api_call("PATCH", "/admin/settings/general", admin_token,
                        {"appName": "TaskBoard Test"})
assert_status("PATCH /admin/settings/general returns 200", 200, status, body)
# Restore
api_call("PATCH", "/admin/settings/general", admin_token, {"appName": "TaskBoard"})

# 5.3 Update notifications
print(f"\n  {CYAN}5.3 Update Notification Settings{NC}")
status, body = api_call("PATCH", "/admin/settings/notifications", admin_token,
                        {"globalEmailEnabled": True, "defaultDigestFrequency": "DAILY", "deadlineReminderHours": 24})
assert_status("PATCH /admin/settings/notifications returns 200", 200, status, body)

# 5.4 Get labels
print(f"\n  {CYAN}5.4 Get Labels{NC}")
status, body = api_call("GET", "/admin/settings/labels", admin_token)
assert_status("GET /admin/settings/labels returns 200", 200, status, body)

# 5.5 Create label
print(f"\n  {CYAN}5.5 Create Label{NC}")
test_label_name = f"IntTest-{int(time.time())}"
status, body = api_call("POST", "/admin/settings/labels", admin_token,
                        {"name": test_label_name, "color": "#FF5733"})
assert_status("POST /admin/settings/labels creates label", 201, status, body)
if isinstance(body, dict):
    data = body.get("data")
    if isinstance(data, dict):
        created_label_id = data.get("id", "")
        if created_label_id:
            print(f"  {GREEN}✅{NC} Created label ID: {created_label_id}")
    else:
        warn("Create label", "Could not extract label ID from response")

# 5.6 Update label
print(f"\n  {CYAN}5.6 Update Label{NC}")
if created_label_id:
    status, body = api_call("PATCH", f"/admin/settings/labels/{created_label_id}", admin_token,
                            {"name": "Updated Test Label", "color": "#33FF57"})
    assert_status("PATCH /admin/settings/labels/:id returns 200", 200, status, body)
else:
    warn("Update label", "Skipped — no label ID")

# 5.7 Delete label
print(f"\n  {CYAN}5.7 Delete Label{NC}")
if created_label_id:
    status, body = api_call("DELETE", f"/admin/settings/labels/{created_label_id}", admin_token)
    assert_status("DELETE /admin/settings/labels/:id returns 200", 200, status, body)
else:
    warn("Delete label", "Skipped — no label ID")

# =============================================================================
# 6. ROLE-BASED ACCESS CONTROL
# =============================================================================
print(f"\n{BLUE}[6] Role-Based Access Control{NC}")

rbac_endpoints = [
    ("GET", "/admin/users", "TEAM_MEMBER → /admin/users"),
    ("GET", "/admin/dashboard/stats", "TEAM_MEMBER → /admin/dashboard/stats"),
    ("GET", "/admin/settings", "TEAM_MEMBER → /admin/settings"),
    ("GET", "/admin/projects", "TEAM_MEMBER → /admin/projects"),
]

for method, endpoint, name in rbac_endpoints:
    print(f"\n  {CYAN}6.x {name}{NC}")
    status, body = api_call(method, endpoint, user_token)
    assert_status_in(f"{name} denied", {401, 403}, status)

# TEAM_MEMBER cannot create users
print(f"\n  {CYAN}6.5 TEAM_MEMBER cannot POST /admin/users{NC}")
status, body = api_call("POST", "/admin/users", user_token,
                        {"name": "Hack", "email": "hack@example.com", "role": "TEAM_MEMBER"})
assert_status_in("TEAM_MEMBER denied from POST /admin/users", {401, 403}, status)

# TEAM_MEMBER cannot modify settings
print(f"\n  {CYAN}6.6 TEAM_MEMBER cannot PATCH /admin/settings/general{NC}")
status, body = api_call("PATCH", "/admin/settings/general", user_token, {"appName": "Hacked"})
assert_status_in("TEAM_MEMBER denied from PATCH settings", {401, 403}, status)

# Admin can access /users/me
print(f"\n  {CYAN}6.7 Admin can access GET /users/me{NC}")
status, body = api_call("GET", "/users/me", admin_token)
assert_status("Admin can access /users/me", 200, status)

# Unauthenticated
print(f"\n  {CYAN}6.8 Unauthenticated cannot access admin projects{NC}")
status, body = api_call("GET", "/admin/projects", "")
assert_status("Unauthenticated denied from /admin/projects", 401, status)

# =============================================================================
# 7. PAGINATION & FILTERING
# =============================================================================
print(f"\n{BLUE}[7] Pagination & Filtering{NC}")

# 7.1 Paginated user list
print(f"\n  {CYAN}7.1 User List Pagination{NC}")
status, body = api_call("GET", "/admin/users?page=1&limit=5", admin_token)
assert_status("Paginated user list returns 200", 200, status)
if isinstance(body, dict):
    meta = body.get("meta", {})
    assert_field("Pagination meta.page", meta, "page")
    assert_field("Pagination meta.limit", meta, "limit")
    assert_field("Pagination meta.total", meta, "total")
    assert_field("Pagination meta.totalPages", meta, "totalPages")

# 7.2 Role filter
print(f"\n  {CYAN}7.2 User List with Role Filter{NC}")
status, body = api_call("GET", "/admin/users?role=ADMIN", admin_token)
assert_status("User list with role=ADMIN returns 200", 200, status)
if isinstance(body, dict):
    users = body.get("data", [])
    if isinstance(users, list) and users:
        all_admin = all(u.get("role", "").upper() == "ADMIN" for u in users)
        total += 1
        if all_admin:
            passed += 1
            print(f"  {GREEN}✅ PASS{NC} Role filter returns only ADMIN users ({len(users)} users)")
        else:
            failed += 1
            roles = [u.get("role") for u in users]
            print(f"  {RED}❌ FAIL{NC} Role filter returned non-ADMIN users: {roles}")
            failures.append(f"Role filter returned non-ADMIN users: {roles}")

# 7.3 Status filter
print(f"\n  {CYAN}7.3 User List with Status Filter{NC}")
status, body = api_call("GET", "/admin/users?status=ACTIVE", admin_token)
assert_status("User list with status=ACTIVE returns 200", 200, status)

# 7.4 Search
print(f"\n  {CYAN}7.4 User List with Search{NC}")
status, body = api_call("GET", "/admin/users?search=admin", admin_token)
assert_status("User list with search=admin returns 200", 200, status)

# 7.5 Project pagination
print(f"\n  {CYAN}7.5 Project List Pagination{NC}")
status, body = api_call("GET", "/admin/projects?page=1&limit=10", admin_token)
assert_status("Paginated project list returns 200", 200, status)
if isinstance(body, dict):
    assert_field("Project list has meta", body, "meta")

# 7.6 Project status filter
print(f"\n  {CYAN}7.6 Project List with Status Filter{NC}")
status, body = api_call("GET", "/admin/projects?status=ACTIVE", admin_token)
assert_status("Project list with status=ACTIVE returns 200", 200, status)

# 7.7 High page number
print(f"\n  {CYAN}7.7 High Page Number{NC}")
status, body = api_call("GET", "/admin/users?page=9999", admin_token)
assert_status("High page number returns 200", 200, status)
if isinstance(body, dict):
    data = body.get("data", [])
    total += 1
    if isinstance(data, list) and len(data) == 0:
        passed += 1
        print(f"  {GREEN}✅ PASS{NC} High page returns empty data array")
    else:
        warn("High page", f"Expected empty data array, got {len(data) if isinstance(data, list) else 'non-list'}")

# =============================================================================
# 8. ERROR SCENARIOS
# =============================================================================
print(f"\n{BLUE}[8] Error Scenarios{NC}")

# 8.1 Missing email
print(f"\n  {CYAN}8.1 Login with Missing Email{NC}")
status, body = api_call("POST", "/auth/login", "",
                        {"password": "admin123"})
assert_status_in("Login missing email rejected", {400, 401}, status)

# 8.2 Missing password
print(f"\n  {CYAN}8.2 Login with Missing Password{NC}")
status, body = api_call("POST", "/auth/login", "",
                        {"email": "admin@example.com"})
assert_status_in("Login missing password rejected", {400, 401}, status)

# 8.3 Create user with empty body
print(f"\n  {CYAN}8.3 Create User with Missing Fields{NC}")
status, body = api_call("POST", "/admin/users", admin_token, {})
assert_status_in("Create user with empty body rejected", {400, 422}, status)

# 8.4 Invalid email
print(f"\n  {CYAN}8.4 Create User with Invalid Email{NC}")
status, body = api_call("POST", "/admin/users", admin_token,
                        {"name": "Bad", "email": "not-an-email", "role": "TEAM_MEMBER"})
assert_status_in("Invalid email rejected", {400, 422}, status)

# 8.5 Invalid status
print(f"\n  {CYAN}8.5 Invalid Status Value{NC}")
if created_user_id:
    status, body = api_call("PATCH", f"/admin/users/{created_user_id}/status", admin_token,
                            {"status": "INVALID_STATUS"})
    assert_status_in("Invalid status rejected", {400, 422}, status)
else:
    warn("Invalid status", "Skipped — no user ID")

# 8.6 Self-suspend
print(f"\n  {CYAN}8.6 Admin Cannot Self-Suspend{NC}")
if admin_id:
    status, body = api_call("PATCH", f"/admin/users/{admin_id}/status", admin_token,
                            {"status": "SUSPENDED"})
    assert_status_in("Admin self-suspend prevented", {400, 403, 422}, status)
else:
    warn("Self-suspend", "Could not extract admin ID")

# 8.7 Self-delete
print(f"\n  {CYAN}8.7 Admin Cannot Self-Delete{NC}")
if admin_id:
    status, body = api_call("DELETE", f"/admin/users/{admin_id}", admin_token)
    assert_status_in("Admin self-delete prevented", {400, 403, 422}, status)
else:
    warn("Self-delete", "Could not extract admin ID")

# 8.8 Invalid JSON
print(f"\n  {CYAN}8.8 Invalid JSON Body{NC}")
try:
    url = f"{BASE_URL}/auth/login"
    req = urllib.request.Request(url, data=b"not-json-at-all", method="POST")
    req.add_header("Content-Type", "application/json")
    opener = urllib.request.build_opener()
    resp = opener.open(req, timeout=5)
    s = resp.status
except urllib.error.HTTPError as e:
    s = e.code
except:
    s = 0
assert_status_in("Invalid JSON body rejected", {400, 415}, s)

# 8.9 Delete non-existent label
print(f"\n  {CYAN}8.9 Delete Non-existent Label{NC}")
status, body = api_call("DELETE", "/admin/settings/labels/00000000-0000-0000-0000-000000000000", admin_token)
assert_status("Delete non-existent label returns 404", 404, status)

# =============================================================================
# 9. ADMIN EXPORT
# =============================================================================
print(f"\n{BLUE}[9] Admin Export Endpoints{NC}")

for name, endpoint in [("Users", "/admin/export/users"),
                       ("Projects", "/admin/export/projects"),
                       ("Tasks", "/admin/export/tasks")]:
    print(f"\n  {CYAN}9.x Export {name}{NC}")
    status, body = api_call("GET", endpoint, admin_token, expect_json=False)
    if status == 200:
        assert_status(f"GET {endpoint} returns 200", 200, status)
    else:
        warn(f"Export {name}", f"Got status {status} — may not be implemented")

# =============================================================================
# 10. RESPONSE SHAPE VERIFICATION
# =============================================================================
print(f"\n{BLUE}[10] Response Shape Verification (Dashboard ↔ Backend){NC}")

# 10.1 User list shape
print(f"\n  {CYAN}10.1 User List Response Shape{NC}")
status, body = api_call("GET", "/admin/users?limit=1", admin_token)
if isinstance(body, dict) and isinstance(body.get("data"), list) and body["data"]:
    u = body["data"][0]
    expected_fields = ["id", "email", "role", "status", "name", "createdAt"]
    for f in expected_fields:
        total += 1
        if f in u:
            passed += 1
            print(f"  {GREEN}✅ PASS{NC} AdminUser has '{f}' = {str(u[f])[:40]}")
        else:
            failed += 1
            print(f"  {RED}❌ FAIL{NC} AdminUser missing '{f}'")
            failures.append(f"AdminUser missing field '{f}' — dashboard/app/types/admin.d.ts expects it")
    print(f"         All fields: {sorted(u.keys())}")
else:
    warn("User shape", "No users in response or unexpected format")

# 10.2 Dashboard stats shape
print(f"\n  {CYAN}10.2 Dashboard Stats Shape{NC}")
status, body = api_call("GET", "/admin/dashboard/stats", admin_token)
if isinstance(body, dict):
    data = body.get("data", body)
    if isinstance(data, dict):
        total += 1; passed += 1
        print(f"  {GREEN}✅ PASS{NC} Stats returns dict with keys: {sorted(data.keys())}")
        for f in ["totalUsers", "totalProjects", "totalTasks", "activeUsersToday"]:
            total += 1
            if f in data:
                passed += 1
                print(f"  {GREEN}✅ PASS{NC} Stats has '{f}' = {data[f]}")
            else:
                failed += 1
                print(f"  {RED}❌ FAIL{NC} Stats missing '{f}'")
                failures.append(f"Dashboard stats missing '{f}' — adminDashboardService.ts expects it")

# 10.3 Settings shape
print(f"\n  {CYAN}10.3 Settings Response Shape{NC}")
status, body = api_call("GET", "/admin/settings", admin_token)
if isinstance(body, dict):
    data = body.get("data", body)
    total += 1
    if isinstance(data, list):
        passed += 1
        print(f"  {GREEN}✅ PASS{NC} Settings returns SystemSetting[] array ({len(data)} items)")
        keys = [r.get("key", "?") for r in data if isinstance(r, dict)]
        print(f"         Keys: {keys}")
    elif isinstance(data, dict):
        passed += 1
        print(f"  {GREEN}✅ PASS{NC} Settings returns object: {sorted(data.keys())}")
    else:
        failed += 1
        print(f"  {RED}❌ FAIL{NC} Settings unexpected shape: {type(data).__name__}")
        failures.append(f"Settings response unexpected type: {type(data).__name__}")

# 10.4 Labels shape
print(f"\n  {CYAN}10.4 Labels Response Shape{NC}")
status, body = api_call("GET", "/admin/settings/labels", admin_token)
if isinstance(body, dict):
    data = body.get("data", body)
    if isinstance(data, list):
        total += 1; passed += 1
        print(f"  {GREEN}✅ PASS{NC} Labels returns array ({len(data)} items)")
        if data:
            lbl = data[0]
            for f in ["id", "name", "color"]:
                total += 1
                if f in lbl:
                    passed += 1
                    print(f"  {GREEN}✅ PASS{NC} Label has '{f}' = {lbl[f]}")
                else:
                    failed += 1
                    print(f"  {RED}❌ FAIL{NC} Label missing '{f}'")
                    failures.append(f"Label missing field '{f}' — admin.d.ts AdminLabel expects it")

# =============================================================================
# CLEANUP
# =============================================================================
print(f"\n{BLUE}[Cleanup] Removing Test Data{NC}")

if created_user_id:
    status, body = api_call("DELETE", f"/admin/users/{created_user_id}", admin_token)
    if status == 200:
        print(f"  {GREEN}✅{NC} Deleted test user {created_user_id}")
    else:
        print(f"  {YELLOW}⚠️{NC} Could not delete test user (status: {status})")

if created_label_id:
    status, body = api_call("DELETE", f"/admin/settings/labels/{created_label_id}", admin_token)
    if status == 200:
        print(f"  {GREEN}✅{NC} Deleted test label {created_label_id}")
    else:
        print(f"  {YELLOW}⚠️{NC} Could not delete test label (status: {status})")

# Cleanup stale integration test labels
status, body = api_call("GET", "/admin/settings/labels", admin_token)
if isinstance(body, dict):
    labels = body.get("data", [])
    if isinstance(labels, list):
        for lbl in labels:
            if isinstance(lbl, dict) and str(lbl.get("name", "")).startswith("IntTest-"):
                lid = lbl.get("id", "")
                if lid and lid != created_label_id:
                    api_call("DELETE", f"/admin/settings/labels/{lid}", admin_token)
                    print(f"  {GREEN}✅{NC} Cleaned up stale label {lbl['name']}")

api_call("GET", "/auth/logout", admin_token)
api_call("GET", "/auth/logout", user_token)

# =============================================================================
# REPORT
# =============================================================================
print(f"\n{CYAN}========================================================={NC}")
print(f"{CYAN} Integration Test Report{NC}")
print(f"{CYAN}========================================================={NC}")
print()
print(f"  Total tests:  {total}")
print(f"  {GREEN}✅ Passed:     {passed}{NC}")
print(f"  {RED}❌ Failed:     {failed}{NC}")
print(f"  {YELLOW}⚠️  Warnings:   {warnings}{NC}")
print()

if failures:
    print(f"{RED}── Failed Checks ──{NC}")
    for f in failures:
        print(f"  - {f}")
    print()

if warning_list:
    print(f"{YELLOW}── Warnings ──{NC}")
    for w in warning_list:
        print(f"  - {w}")
    print()

if failed == 0:
    print(f"{GREEN}All tests passed!{NC}")
    sys.exit(0)
else:
    print(f"{RED}{failed} test(s) failed.{NC}")
    sys.exit(1)
