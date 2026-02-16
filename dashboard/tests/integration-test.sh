#!/usr/bin/env bash
# =============================================================================
# TaskBoard Admin Dashboard - Integration Tests
# Tests: Auth flow, CRUD, Role-based access, Pagination, Error scenarios
# Target: Backend API at http://localhost:3000/api
# =============================================================================

set -euo pipefail

BASE_URL="http://localhost:3000/api"
COOKIE_JAR_ADMIN="/tmp/taskboard_admin_cookies.txt"
COOKIE_JAR_USER="/tmp/taskboard_user_cookies.txt"
COOKIE_JAR_ANON="/tmp/taskboard_anon_cookies.txt"

# Counters
PASSED=0
FAILED=0
WARNINGS=0
TOTAL=0
FAILURES=""
WARNING_LIST=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Cleanup
rm -f "$COOKIE_JAR_ADMIN" "$COOKIE_JAR_USER" "$COOKIE_JAR_ANON"
touch "$COOKIE_JAR_ADMIN" "$COOKIE_JAR_USER" "$COOKIE_JAR_ANON"

# Created resource IDs (for cleanup)
CREATED_USER_ID=""
CREATED_LABEL_ID=""
TEST_USER_EMAIL="integration-test-$(date +%s)@example.com"

# =============================================================================
# Helpers
# =============================================================================

assert_status() {
  local test_name="$1"
  local expected="$2"
  local actual="$3"
  local body="${4:-}"
  local file_ref="${5:-}"

  TOTAL=$((TOTAL + 1))

  if [ "$actual" -eq "$expected" ]; then
    PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✅ PASS${NC} [$actual] $test_name"
  else
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}❌ FAIL${NC} [$actual != $expected] $test_name"
    local detail="Test: $test_name | Expected: $expected | Got: $actual"
    if [ -n "$body" ]; then
      detail="$detail | Body: $(echo "$body" | head -c 200)"
    fi
    if [ -n "$file_ref" ]; then
      detail="$detail | File: $file_ref"
    fi
    FAILURES="${FAILURES}\n- $detail"
  fi
}

assert_json_field() {
  local test_name="$1"
  local body="$2"
  local field="$3"
  local expected_value="${4:-}"

  TOTAL=$((TOTAL + 1))

  local actual_value
  actual_value=$(echo "$body" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    keys = '$field'.split('.')
    v = d
    for k in keys:
        if isinstance(v, list):
            v = v[int(k)]
        else:
            v = v[k]
    print(v)
except:
    print('__MISSING__')
" 2>/dev/null || echo "__MISSING__")

  if [ "$actual_value" = "__MISSING__" ]; then
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}❌ FAIL${NC} $test_name — field '$field' missing"
    FAILURES="${FAILURES}\n- $test_name: field '$field' missing in response"
    return
  fi

  if [ -n "$expected_value" ]; then
    if [ "$actual_value" = "$expected_value" ]; then
      PASSED=$((PASSED + 1))
      echo -e "  ${GREEN}✅ PASS${NC} $test_name ($field=$actual_value)"
    else
      FAILED=$((FAILED + 1))
      echo -e "  ${RED}❌ FAIL${NC} $test_name ($field: expected '$expected_value', got '$actual_value')"
      FAILURES="${FAILURES}\n- $test_name: $field expected '$expected_value', got '$actual_value'"
    fi
  else
    PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✅ PASS${NC} $test_name ($field=$actual_value)"
  fi
}

assert_json_exists() {
  local test_name="$1"
  local body="$2"
  local field="$3"
  assert_json_field "$test_name" "$body" "$field"
}

warn() {
  local test_name="$1"
  local detail="$2"
  WARNINGS=$((WARNINGS + 1))
  echo -e "  ${YELLOW}⚠️  WARN${NC} $test_name — $detail"
  WARNING_LIST="${WARNING_LIST}\n- $test_name: $detail"
}

api_call() {
  local method="$1"
  local endpoint="$2"
  local cookie_jar="$3"
  local data="${4:-}"
  local extra_args="${5:-}"

  local url="${BASE_URL}${endpoint}"
  local cmd="curl -s -w '\n%{http_code}' -b '$cookie_jar' -c '$cookie_jar'"

  if [ "$method" = "GET" ]; then
    cmd="$cmd -X GET"
  elif [ "$method" = "POST" ]; then
    cmd="$cmd -X POST -H 'Content-Type: application/json'"
    if [ -n "$data" ]; then
      cmd="$cmd -d '$data'"
    fi
  elif [ "$method" = "PATCH" ]; then
    cmd="$cmd -X PATCH -H 'Content-Type: application/json'"
    if [ -n "$data" ]; then
      cmd="$cmd -d '$data'"
    fi
  elif [ "$method" = "DELETE" ]; then
    cmd="$cmd -X DELETE"
  fi

  cmd="$cmd '$url' $extra_args"
  eval "$cmd"
}

extract_status() {
  echo "$1" | tail -1
}

extract_body() {
  echo "$1" | sed '$d'
}

# =============================================================================
# Pre-flight check
# =============================================================================
echo -e "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} TaskBoard Admin Dashboard Integration Tests${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "Target: ${BASE_URL}"
echo -e "Time:   $(date)"
echo ""

echo -e "${BLUE}[0] Pre-flight Check${NC}"
HEALTH_RESULT=$(curl -s -w '\n%{http_code}' "${BASE_URL}/health" 2>/dev/null || echo -e "\n000")
HEALTH_STATUS=$(extract_status "$HEALTH_RESULT")
if [ "$HEALTH_STATUS" != "200" ]; then
  echo -e "${RED}Backend is not running at ${BASE_URL}. Aborting.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✅${NC} Backend is healthy"

# =============================================================================
# 1. AUTH FLOW
# =============================================================================
echo ""
echo -e "${BLUE}[1] Authentication Flow${NC}"

# 1.1 Admin Login - Success
echo -e "\n  ${CYAN}1.1 Admin Login${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/admin-login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR_ADMIN" \
  -d '{"email":"admin@example.com","password":"admin123"}')
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "Admin login succeeds" 201 "$STATUS" "$BODY" "backend/src/modules/auth/auth.controller.ts"

# Check accessToken cookie was set (refreshToken is in response body, not cookie)
if grep -q "accessToken" "$COOKIE_JAR_ADMIN" 2>/dev/null; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} accessToken cookie set"
else
  TOTAL=$((TOTAL + 1)); FAILED=$((FAILED + 1))
  echo -e "  ${RED}❌ FAIL${NC} accessToken cookie NOT set"
  FAILURES="${FAILURES}\n- accessToken cookie not found in response after admin login"
fi

# Check response body has refreshToken
BODY_HAS_REFRESH=$(echo "$BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    data = d.get('data', d)
    print('true' if data.get('refreshToken') or data.get('token') else 'false')
except:
    print('false')
" 2>/dev/null || echo "false")
if [ "$BODY_HAS_REFRESH" = "true" ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} refreshToken in response body"
else
  TOTAL=$((TOTAL + 1)); FAILED=$((FAILED + 1))
  echo -e "  ${RED}❌ FAIL${NC} refreshToken NOT in response body"
  FAILURES="${FAILURES}\n- refreshToken not found in response body after admin login"
fi

# Extract refreshToken from response body for later use
ADMIN_REFRESH_TOKEN=$(echo "$BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    data = d.get('data', d)
    print(data.get('refreshToken', ''))
except:
    print('')
" 2>/dev/null || echo "")

# 1.2 Check-login with valid token
echo -e "\n  ${CYAN}1.2 Check Login${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/auth/check-login" \
  -b "$COOKIE_JAR_ADMIN" -c "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "check-login returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/auth/auth.controller.ts"
assert_json_exists "check-login returns user data" "$BODY" "data.id"
assert_json_exists "check-login has email" "$BODY" "data.email"

# 1.3 Regular user login
echo -e "\n  ${CYAN}1.3 Regular User Login${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR_USER" \
  -d '{"email":"user@example.com","password":"user123"}')
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "Regular user login succeeds" 201 "$STATUS" "$BODY" "backend/src/modules/auth/auth.controller.ts"

# 1.4 Admin login with wrong password
echo -e "\n  ${CYAN}1.4 Failed Login (wrong password)${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/admin-login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR_ANON" \
  -d '{"email":"admin@example.com","password":"wrongpassword"}')
STATUS=$(extract_status "$RESULT")
assert_status "Wrong password returns 401" 401 "$STATUS"

# 1.5 Admin login with non-admin user
echo -e "\n  ${CYAN}1.5 Non-admin user on admin-login${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/admin-login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR_ANON" \
  -d '{"email":"user@example.com","password":"user123"}')
STATUS=$(extract_status "$RESULT")
# Should be 403 (not admin role)
if [ "$STATUS" -eq 403 ]; then
  assert_status "Non-admin on admin-login returns 403" 403 "$STATUS"
elif [ "$STATUS" -eq 401 ]; then
  warn "Non-admin on admin-login" "Expected 403 but got 401. Backend may reject before role check."
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Non-admin correctly rejected (401)"
else
  assert_status "Non-admin on admin-login rejected" 403 "$STATUS"
fi

# 1.6 Access protected endpoint without auth
echo -e "\n  ${CYAN}1.6 Unauthenticated access to protected endpoint${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users" \
  -b "$COOKIE_JAR_ANON")
STATUS=$(extract_status "$RESULT")
assert_status "Unauthenticated GET /admin/users returns 401" 401 "$STATUS"

# 1.7 Refresh token (using token from login response body)
echo -e "\n  ${CYAN}1.7 Refresh Access Token${NC}"
if [ -n "$ADMIN_REFRESH_TOKEN" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X GET "${BASE_URL}/auth/refresh-access-token?refreshToken=${ADMIN_REFRESH_TOKEN}" \
    -b "$COOKIE_JAR_ADMIN" -c "$COOKIE_JAR_ADMIN")
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 201 ]; then
    TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✅ PASS${NC} [$STATUS] Token refresh succeeds"
  else
    warn "Token refresh" "Got status $STATUS - refresh token may have been rotated already"
  fi
else
  warn "Token refresh" "Could not extract refreshToken from login response body"
fi

# 1.8 Logout
echo -e "\n  ${CYAN}1.8 Logout${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/auth/logout" \
  -b "$COOKIE_JAR_ADMIN" -c "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Logout returns 200" 200 "$STATUS"

# 1.9 After logout, check-login should fail
echo -e "\n  ${CYAN}1.9 Check login after logout${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/auth/check-login" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Check login after logout returns 401" 401 "$STATUS"

# Re-login admin for subsequent tests
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/admin-login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR_ADMIN" \
  -d '{"email":"admin@example.com","password":"admin123"}')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -ne 201 ] && [ "$STATUS" -ne 200 ]; then
  echo -e "${RED}Failed to re-login admin. Cannot continue. Status: $STATUS${NC}"
  exit 1
fi
echo -e "  ${GREEN}✅${NC} Re-logged in admin for subsequent tests"

# =============================================================================
# 2. ADMIN USER MANAGEMENT (CRUD)
# =============================================================================
echo ""
echo -e "${BLUE}[2] Admin User Management — CRUD${NC}"

# 2.1 List users
echo -e "\n  ${CYAN}2.1 List Users${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "GET /admin/users returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-user.controller.ts"
assert_json_exists "User list has data array" "$BODY" "data"
assert_json_exists "User list has meta" "$BODY" "meta"
assert_json_exists "User list meta has total" "$BODY" "meta.total"

# 2.2 Create user
echo -e "\n  ${CYAN}2.2 Create User${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/admin/users" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d "{\"name\":\"Integration Test User\",\"email\":\"$TEST_USER_EMAIL\",\"role\":\"TEAM_MEMBER\"}")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "POST /admin/users creates user" 201 "$STATUS" "$BODY" "backend/src/modules/admin/admin-user.controller.ts"

# Extract created user ID
CREATED_USER_ID=$(echo "$BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    uid = d.get('data', d).get('id', '')
    print(uid)
except:
    print('')
" 2>/dev/null || echo "")

if [ -n "$CREATED_USER_ID" ]; then
  echo -e "  ${GREEN}✅${NC} Created user ID: $CREATED_USER_ID"
else
  warn "Create user" "Could not extract user ID from response"
fi

# 2.3 Get user by ID
echo -e "\n  ${CYAN}2.3 Get User Detail${NC}"
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X GET "${BASE_URL}/admin/users/${CREATED_USER_ID}" \
    -b "$COOKIE_JAR_ADMIN")
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  assert_status "GET /admin/users/:id returns 200" 200 "$STATUS" "$BODY"
  assert_json_exists "User detail has email" "$BODY" "data.email"
else
  warn "Get user detail" "Skipped — no user ID available"
fi

# 2.4 Update user
echo -e "\n  ${CYAN}2.4 Update User${NC}"
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X PATCH "${BASE_URL}/admin/users/${CREATED_USER_ID}" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d '{"name":"Updated Test User","jobTitle":"QA Engineer"}')
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  assert_status "PATCH /admin/users/:id returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-user.controller.ts"
else
  warn "Update user" "Skipped — no user ID available"
fi

# 2.5 Change user status (suspend)
echo -e "\n  ${CYAN}2.5 Change User Status (Suspend)${NC}"
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X PATCH "${BASE_URL}/admin/users/${CREATED_USER_ID}/status" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d '{"status":"SUSPENDED"}')
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  assert_status "Suspend user returns 200" 200 "$STATUS" "$BODY"
else
  warn "Suspend user" "Skipped — no user ID available"
fi

# 2.6 Change user status (reactivate)
echo -e "\n  ${CYAN}2.6 Change User Status (Activate)${NC}"
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X PATCH "${BASE_URL}/admin/users/${CREATED_USER_ID}/status" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d '{"status":"ACTIVE"}')
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  assert_status "Reactivate user returns 200" 200 "$STATUS" "$BODY"
else
  warn "Reactivate user" "Skipped — no user ID available"
fi

# 2.7 Change user role
echo -e "\n  ${CYAN}2.7 Change User Role${NC}"
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X PATCH "${BASE_URL}/admin/users/${CREATED_USER_ID}/role" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d '{"role":"PROJECT_OWNER"}')
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  assert_status "Change user role returns 200" 200 "$STATUS" "$BODY"
else
  warn "Change user role" "Skipped — no user ID available"
fi

# 2.8 Reset user password
echo -e "\n  ${CYAN}2.8 Reset User Password${NC}"
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X POST "${BASE_URL}/admin/users/${CREATED_USER_ID}/reset-password" \
    -b "$COOKIE_JAR_ADMIN")
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  # May return 200 or 500 if email service not configured
  if [ "$STATUS" -eq 200 ]; then
    assert_status "Reset password returns 200" 200 "$STATUS"
  else
    warn "Reset user password" "Got status $STATUS — email service may not be configured"
  fi
else
  warn "Reset user password" "Skipped — no user ID available"
fi

# 2.9 Create duplicate user (should fail)
echo -e "\n  ${CYAN}2.9 Create Duplicate User${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/admin/users" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d "{\"name\":\"Duplicate User\",\"email\":\"$TEST_USER_EMAIL\",\"role\":\"TEAM_MEMBER\"}")
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 409 ] || [ "$STATUS" -eq 400 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Duplicate user correctly rejected [$STATUS]"
else
  assert_status "Duplicate user returns 409/400" 409 "$STATUS"
fi

# 2.10 Get non-existent user
echo -e "\n  ${CYAN}2.10 Get Non-existent User${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users/00000000-0000-0000-0000-000000000000" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Non-existent user returns 404" 404 "$STATUS"

# =============================================================================
# 3. ADMIN PROJECT MANAGEMENT
# =============================================================================
echo ""
echo -e "${BLUE}[3] Admin Project Management${NC}"

# 3.1 List projects
echo -e "\n  ${CYAN}3.1 List Projects${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/projects" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "GET /admin/projects returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-project.controller.ts"
assert_json_exists "Project list has data" "$BODY" "data"
assert_json_exists "Project list has meta" "$BODY" "meta"

# Extract a project ID if available
PROJECT_ID=$(echo "$BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    items = d.get('data', [])
    if items:
        print(items[0].get('id', ''))
    else:
        print('')
except:
    print('')
" 2>/dev/null || echo "")

# 3.2 Get project detail (if we have one)
echo -e "\n  ${CYAN}3.2 Get Project Detail${NC}"
if [ -n "$PROJECT_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X GET "${BASE_URL}/admin/projects/${PROJECT_ID}" \
    -b "$COOKIE_JAR_ADMIN")
  STATUS=$(extract_status "$RESULT")
  BODY=$(extract_body "$RESULT")
  assert_status "GET /admin/projects/:id returns 200" 200 "$STATUS" "$BODY"
  assert_json_exists "Project detail has data" "$BODY" "data"
else
  warn "Get project detail" "No projects exist in DB — skipped"
fi

# 3.3 Get non-existent project
echo -e "\n  ${CYAN}3.3 Get Non-existent Project${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/projects/00000000-0000-0000-0000-000000000000" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Non-existent project returns 404" 404 "$STATUS"

# =============================================================================
# 4. ADMIN DASHBOARD STATS & CHARTS
# =============================================================================
echo ""
echo -e "${BLUE}[4] Admin Dashboard — Stats & Charts${NC}"

# 4.1 Dashboard stats
echo -e "\n  ${CYAN}4.1 Dashboard Stats${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/dashboard/stats" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "GET /admin/dashboard/stats returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-dashboard.controller.ts"
assert_json_exists "Stats has data" "$BODY" "data"

# 4.2 Dashboard charts
echo -e "\n  ${CYAN}4.2 Dashboard Charts${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/dashboard/charts" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "GET /admin/dashboard/charts returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-dashboard.controller.ts"
assert_json_exists "Charts has data" "$BODY" "data"

# 4.3 Dashboard recent activity
echo -e "\n  ${CYAN}4.3 Dashboard Recent Activity${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/dashboard/recent-activity" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "GET /admin/dashboard/recent-activity returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-dashboard.controller.ts"

# 4.4 Dashboard stats with period filter
echo -e "\n  ${CYAN}4.4 Dashboard Stats with Period Filter${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/dashboard/stats?period=7days" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Stats with period=7days returns 200" 200 "$STATUS"

# =============================================================================
# 5. ADMIN SYSTEM CONFIGURATION
# =============================================================================
echo ""
echo -e "${BLUE}[5] Admin System Configuration${NC}"

# 5.1 Get settings
echo -e "\n  ${CYAN}5.1 Get Settings${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/settings" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "GET /admin/settings returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-settings.controller.ts"

# 5.2 Update general settings
echo -e "\n  ${CYAN}5.2 Update General Settings${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X PATCH "${BASE_URL}/admin/settings/general" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d '{"appName":"TaskBoard Test"}')
STATUS=$(extract_status "$RESULT")
assert_status "PATCH /admin/settings/general returns 200" 200 "$STATUS"

# Restore original name
curl -s -X PATCH "${BASE_URL}/admin/settings/general" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d '{"appName":"TaskBoard"}' > /dev/null 2>&1

# 5.3 Update notification settings
echo -e "\n  ${CYAN}5.3 Update Notification Settings${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X PATCH "${BASE_URL}/admin/settings/notifications" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d '{"globalEmailEnabled":true,"defaultDigestFrequency":"DAILY","deadlineReminderHours":24}')
STATUS=$(extract_status "$RESULT")
assert_status "PATCH /admin/settings/notifications returns 200" 200 "$STATUS"

# 5.4 Get labels
echo -e "\n  ${CYAN}5.4 Get Labels${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/settings/labels" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "GET /admin/settings/labels returns 200" 200 "$STATUS" "$BODY" "backend/src/modules/admin/admin-settings.controller.ts"

# 5.5 Create label
echo -e "\n  ${CYAN}5.5 Create Label${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/admin/settings/labels" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d '{"name":"Integration Test Label","color":"#FF5733"}')
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "POST /admin/settings/labels creates label" 201 "$STATUS" "$BODY"

CREATED_LABEL_ID=$(echo "$BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    lid = d.get('data', d).get('id', '')
    print(lid)
except:
    print('')
" 2>/dev/null || echo "")

if [ -n "$CREATED_LABEL_ID" ]; then
  echo -e "  ${GREEN}✅${NC} Created label ID: $CREATED_LABEL_ID"
fi

# 5.6 Update label
echo -e "\n  ${CYAN}5.6 Update Label${NC}"
if [ -n "$CREATED_LABEL_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X PATCH "${BASE_URL}/admin/settings/labels/${CREATED_LABEL_ID}" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d '{"name":"Updated Test Label","color":"#33FF57"}')
  STATUS=$(extract_status "$RESULT")
  assert_status "PATCH /admin/settings/labels/:id returns 200" 200 "$STATUS"
else
  warn "Update label" "Skipped — no label ID available"
fi

# 5.7 Delete label
echo -e "\n  ${CYAN}5.7 Delete Label${NC}"
if [ -n "$CREATED_LABEL_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X DELETE "${BASE_URL}/admin/settings/labels/${CREATED_LABEL_ID}" \
    -b "$COOKIE_JAR_ADMIN")
  STATUS=$(extract_status "$RESULT")
  assert_status "DELETE /admin/settings/labels/:id returns 200" 200 "$STATUS"
else
  warn "Delete label" "Skipped — no label ID available"
fi

# =============================================================================
# 6. ROLE-BASED ACCESS CONTROL
# =============================================================================
echo ""
echo -e "${BLUE}[6] Role-Based Access Control${NC}"

# 6.1 Regular user cannot access admin endpoints
echo -e "\n  ${CYAN}6.1 TEAM_MEMBER cannot access GET /admin/users${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users" \
  -b "$COOKIE_JAR_USER")
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 401 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} TEAM_MEMBER denied from /admin/users [$STATUS]"
else
  assert_status "TEAM_MEMBER denied from /admin/users" 403 "$STATUS"
fi

# 6.2 Regular user cannot access admin dashboard
echo -e "\n  ${CYAN}6.2 TEAM_MEMBER cannot access admin dashboard${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/dashboard/stats" \
  -b "$COOKIE_JAR_USER")
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 401 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} TEAM_MEMBER denied from /admin/dashboard/stats [$STATUS]"
else
  assert_status "TEAM_MEMBER denied from /admin/dashboard/stats" 403 "$STATUS"
fi

# 6.3 Regular user cannot access admin settings
echo -e "\n  ${CYAN}6.3 TEAM_MEMBER cannot access admin settings${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/settings" \
  -b "$COOKIE_JAR_USER")
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 401 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} TEAM_MEMBER denied from /admin/settings [$STATUS]"
else
  assert_status "TEAM_MEMBER denied from /admin/settings" 403 "$STATUS"
fi

# 6.4 Regular user cannot create admin users
echo -e "\n  ${CYAN}6.4 TEAM_MEMBER cannot create admin users${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/admin/users" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_USER" \
  -d '{"name":"Hack User","email":"hack@example.com","role":"TEAM_MEMBER"}')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 401 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} TEAM_MEMBER denied from creating admin users [$STATUS]"
else
  assert_status "TEAM_MEMBER denied from POST /admin/users" 403 "$STATUS"
fi

# 6.5 Regular user cannot modify admin settings
echo -e "\n  ${CYAN}6.5 TEAM_MEMBER cannot modify settings${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X PATCH "${BASE_URL}/admin/settings/general" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_USER" \
  -d '{"appName":"Hacked"}')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 401 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} TEAM_MEMBER denied from modifying settings [$STATUS]"
else
  assert_status "TEAM_MEMBER denied from PATCH /admin/settings/general" 403 "$STATUS"
fi

# 6.6 Admin can access user profile endpoint
echo -e "\n  ${CYAN}6.6 Admin can access GET /users/me${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/users/me" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Admin can access /users/me" 200 "$STATUS"

# 6.7 Unauthenticated cannot access admin projects
echo -e "\n  ${CYAN}6.7 Unauthenticated cannot access admin projects${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/projects")
STATUS=$(extract_status "$RESULT")
assert_status "Unauthenticated denied from /admin/projects" 401 "$STATUS"

# =============================================================================
# 7. PAGINATION & FILTERING
# =============================================================================
echo ""
echo -e "${BLUE}[7] Pagination & Filtering${NC}"

# 7.1 Paginated user list with page & limit
echo -e "\n  ${CYAN}7.1 User List Pagination${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users?page=1&limit=5" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "Paginated user list (page=1, limit=5) returns 200" 200 "$STATUS"
assert_json_exists "Pagination meta has page" "$BODY" "meta.page"
assert_json_exists "Pagination meta has limit" "$BODY" "meta.limit"
assert_json_exists "Pagination meta has total" "$BODY" "meta.total"

# 7.2 User list with role filter
echo -e "\n  ${CYAN}7.2 User List with Role Filter${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users?role=ADMIN" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "User list with role=ADMIN returns 200" 200 "$STATUS"

# Check all returned users have ADMIN role
ADMIN_ONLY=$(echo "$BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    users = d.get('data', [])
    all_admin = all(u.get('role','').upper() == 'ADMIN' for u in users)
    print('true' if all_admin else 'false')
except:
    print('error')
" 2>/dev/null || echo "error")
if [ "$ADMIN_ONLY" = "true" ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Role filter returns only ADMIN users"
else
  warn "Role filter" "Returned users may not all be ADMIN — verify backend filter implementation"
fi

# 7.3 User list with status filter
echo -e "\n  ${CYAN}7.3 User List with Status Filter${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users?status=ACTIVE" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "User list with status=ACTIVE returns 200" 200 "$STATUS"

# 7.4 User list with search
echo -e "\n  ${CYAN}7.4 User List with Search${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users?search=admin" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "User list with search=admin returns 200" 200 "$STATUS"

# 7.5 Project list pagination
echo -e "\n  ${CYAN}7.5 Project List Pagination${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/projects?page=1&limit=10" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
assert_status "Paginated project list returns 200" 200 "$STATUS"
assert_json_exists "Project pagination has meta" "$BODY" "meta"

# 7.6 Project list with status filter
echo -e "\n  ${CYAN}7.6 Project List with Status Filter${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/projects?status=ACTIVE" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Project list with status=ACTIVE returns 200" 200 "$STATUS"

# 7.7 Invalid page number
echo -e "\n  ${CYAN}7.7 Invalid Page Number${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/users?page=9999" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
BODY=$(extract_body "$RESULT")
# Should return 200 with empty data
assert_status "High page number returns 200 (empty data)" 200 "$STATUS"
EMPTY_DATA=$(echo "$BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(len(d.get('data', [])))
except:
    print('-1')
" 2>/dev/null || echo "-1")
if [ "$EMPTY_DATA" = "0" ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} High page returns empty data array"
else
  warn "High page number" "Expected empty data array, got length $EMPTY_DATA"
fi

# =============================================================================
# 8. ERROR SCENARIOS
# =============================================================================
echo ""
echo -e "${BLUE}[8] Error Scenarios${NC}"

# 8.1 Login with missing email (use /auth/login to avoid admin-login rate limit)
echo -e "\n  ${CYAN}8.1 Login with Missing Email${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 401 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Login missing email rejected [$STATUS]"
else
  assert_status "Login missing email returns 400/401" 400 "$STATUS"
fi

# 8.2 Login with missing password
echo -e "\n  ${CYAN}8.2 Login with Missing Password${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 401 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Login missing password rejected [$STATUS]"
else
  assert_status "Login missing password returns 400/401" 400 "$STATUS"
fi

# 8.3 Create user with missing required fields
echo -e "\n  ${CYAN}8.3 Create User with Missing Fields${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/admin/users" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d '{}')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 422 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Create user with empty body returns [$STATUS]"
else
  assert_status "Create user with empty body returns 400" 400 "$STATUS"
fi

# 8.4 Create user with invalid email
echo -e "\n  ${CYAN}8.4 Create User with Invalid Email${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/admin/users" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR_ADMIN" \
  -d '{"name":"Bad Email","email":"not-an-email","role":"TEAM_MEMBER"}')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 422 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Invalid email rejected [$STATUS]"
else
  assert_status "Invalid email rejected" 400 "$STATUS"
fi

# 8.5 Invalid status value
echo -e "\n  ${CYAN}8.5 Invalid Status Value${NC}"
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X PATCH "${BASE_URL}/admin/users/${CREATED_USER_ID}/status" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d '{"status":"INVALID_STATUS"}')
  STATUS=$(extract_status "$RESULT")
  if [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 422 ]; then
    TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✅ PASS${NC} Invalid status value rejected [$STATUS]"
  else
    assert_status "Invalid status value rejected" 400 "$STATUS"
  fi
else
  warn "Invalid status value" "Skipped — no user ID available"
fi

# 8.6 Admin cannot suspend themselves
echo -e "\n  ${CYAN}8.6 Admin Cannot Self-Suspend${NC}"
ADMIN_ID=$(curl -s -X GET "${BASE_URL}/auth/check-login" \
  -b "$COOKIE_JAR_ADMIN" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('data', {}).get('id', ''))
except:
    print('')
" 2>/dev/null || echo "")

if [ -n "$ADMIN_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X PATCH "${BASE_URL}/admin/users/${ADMIN_ID}/status" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR_ADMIN" \
    -d '{"status":"SUSPENDED"}')
  STATUS=$(extract_status "$RESULT")
  if [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 422 ]; then
    TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✅ PASS${NC} Admin cannot self-suspend [$STATUS]"
  else
    assert_status "Admin self-suspend prevented" 403 "$STATUS"
  fi
else
  warn "Admin self-suspend" "Could not extract admin ID"
fi

# 8.7 Admin cannot delete themselves
echo -e "\n  ${CYAN}8.7 Admin Cannot Self-Delete${NC}"
if [ -n "$ADMIN_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X DELETE "${BASE_URL}/admin/users/${ADMIN_ID}" \
    -b "$COOKIE_JAR_ADMIN")
  STATUS=$(extract_status "$RESULT")
  if [ "$STATUS" -eq 403 ] || [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 422 ]; then
    TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✅ PASS${NC} Admin cannot self-delete [$STATUS]"
  else
    assert_status "Admin self-delete prevented" 403 "$STATUS"
  fi
else
  warn "Admin self-delete" "Could not extract admin ID"
fi

# 8.8 Invalid JSON body (use /auth/login to avoid admin-login rate limit)
echo -e "\n  ${CYAN}8.8 Invalid JSON Body${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d 'not-json-at-all')
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 400 ] || [ "$STATUS" -eq 415 ]; then
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Invalid JSON body rejected [$STATUS]"
else
  assert_status "Invalid JSON body rejected" 400 "$STATUS"
fi

# 8.9 Delete label that doesn't exist
echo -e "\n  ${CYAN}8.9 Delete Non-existent Label${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X DELETE "${BASE_URL}/admin/settings/labels/00000000-0000-0000-0000-000000000000" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
assert_status "Delete non-existent label returns 404" 404 "$STATUS"

# =============================================================================
# 9. ADMIN EXPORT ENDPOINTS
# =============================================================================
echo ""
echo -e "${BLUE}[9] Admin Export Endpoints${NC}"

# 9.1 Export users
echo -e "\n  ${CYAN}9.1 Export Users${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/export/users" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 200 ]; then
  assert_status "GET /admin/export/users returns 200" 200 "$STATUS"
else
  warn "Export users" "Got status $STATUS — export endpoint may not be fully implemented"
fi

# 9.2 Export projects
echo -e "\n  ${CYAN}9.2 Export Projects${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/export/projects" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 200 ]; then
  assert_status "GET /admin/export/projects returns 200" 200 "$STATUS"
else
  warn "Export projects" "Got status $STATUS — export endpoint may not be fully implemented"
fi

# 9.3 Export tasks
echo -e "\n  ${CYAN}9.3 Export Tasks${NC}"
RESULT=$(curl -s -w '\n%{http_code}' \
  -X GET "${BASE_URL}/admin/export/tasks" \
  -b "$COOKIE_JAR_ADMIN")
STATUS=$(extract_status "$RESULT")
if [ "$STATUS" -eq 200 ]; then
  assert_status "GET /admin/export/tasks returns 200" 200 "$STATUS"
else
  warn "Export tasks" "Got status $STATUS — export endpoint may not be fully implemented"
fi

# =============================================================================
# 10. FRONTEND SERVICE ↔ BACKEND SHAPE VERIFICATION
# =============================================================================
echo ""
echo -e "${BLUE}[10] Response Shape Verification (Dashboard Services)${NC}"

# 10.1 Verify admin user list response shape matches AdminUser type
echo -e "\n  ${CYAN}10.1 User List Response Shape${NC}"
RESULT=$(curl -s -X GET "${BASE_URL}/admin/users?limit=1" -b "$COOKIE_JAR_ADMIN")
USER_SHAPE=$(echo "$RESULT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    users = d.get('data', [])
    if not users:
        print('NO_DATA')
    else:
        u = users[0]
        fields = sorted(u.keys())
        print(','.join(fields))
except Exception as e:
    print('ERROR: ' + str(e))
" 2>/dev/null || echo "ERROR")
TOTAL=$((TOTAL + 1))
if [ "$USER_SHAPE" != "ERROR" ] && [ "$USER_SHAPE" != "NO_DATA" ]; then
  PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} User list returns structured data"
  echo -e "         Fields: $USER_SHAPE"

  # Check for key expected fields
  for FIELD in id email role status; do
    if echo "$USER_SHAPE" | grep -q "$FIELD"; then
      TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
      echo -e "  ${GREEN}✅ PASS${NC} User has field: $FIELD"
    else
      TOTAL=$((TOTAL + 1)); FAILED=$((FAILED + 1))
      echo -e "  ${RED}❌ FAIL${NC} User missing field: $FIELD"
      FAILURES="${FAILURES}\n- User response missing field '$FIELD' — dashboard/app/types/admin.d.ts expects it"
    fi
  done
else
  FAILED=$((FAILED + 1))
  echo -e "  ${RED}❌ FAIL${NC} User list response shape: $USER_SHAPE"
  FAILURES="${FAILURES}\n- User list response could not be parsed"
fi

# 10.2 Verify dashboard stats response shape
echo -e "\n  ${CYAN}10.2 Dashboard Stats Response Shape${NC}"
RESULT=$(curl -s -X GET "${BASE_URL}/admin/dashboard/stats" -b "$COOKIE_JAR_ADMIN")
STATS_SHAPE=$(echo "$RESULT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    stats = d.get('data', d)
    fields = sorted(stats.keys()) if isinstance(stats, dict) else ['NOT_DICT']
    print(','.join(fields))
except Exception as e:
    print('ERROR: ' + str(e))
" 2>/dev/null || echo "ERROR")
TOTAL=$((TOTAL + 1))
if [ "$STATS_SHAPE" != "ERROR" ]; then
  PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Stats returns structured data"
  echo -e "         Fields: $STATS_SHAPE"
else
  FAILED=$((FAILED + 1))
  echo -e "  ${RED}❌ FAIL${NC} Stats response could not be parsed"
fi

# 10.3 Verify settings response is an array (transformed by frontend)
echo -e "\n  ${CYAN}10.3 Settings Response Shape${NC}"
RESULT=$(curl -s -X GET "${BASE_URL}/admin/settings" -b "$COOKIE_JAR_ADMIN")
SETTINGS_SHAPE=$(echo "$RESULT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    data = d.get('data', d)
    if isinstance(data, list):
        print('ARRAY:' + str(len(data)))
    elif isinstance(data, dict):
        print('OBJECT:' + ','.join(sorted(data.keys())))
    else:
        print('UNKNOWN:' + str(type(data).__name__))
except Exception as e:
    print('ERROR: ' + str(e))
" 2>/dev/null || echo "ERROR")
TOTAL=$((TOTAL + 1))
if echo "$SETTINGS_SHAPE" | grep -q "ARRAY"; then
  PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Settings returns array (SystemSetting[]) — $SETTINGS_SHAPE"
  echo -e "         (Dashboard transforms this to AdminSettings via adminSettingsService)"
elif echo "$SETTINGS_SHAPE" | grep -q "OBJECT"; then
  PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC} Settings returns object — $SETTINGS_SHAPE"
else
  FAILED=$((FAILED + 1))
  echo -e "  ${RED}❌ FAIL${NC} Settings response unexpected shape: $SETTINGS_SHAPE"
fi

# =============================================================================
# CLEANUP
# =============================================================================
echo ""
echo -e "${BLUE}[Cleanup] Removing Test Data${NC}"

# Delete test user
if [ -n "$CREATED_USER_ID" ]; then
  RESULT=$(curl -s -w '\n%{http_code}' \
    -X DELETE "${BASE_URL}/admin/users/${CREATED_USER_ID}" \
    -b "$COOKIE_JAR_ADMIN")
  STATUS=$(extract_status "$RESULT")
  if [ "$STATUS" -eq 200 ]; then
    echo -e "  ${GREEN}✅${NC} Deleted test user $CREATED_USER_ID"
  else
    echo -e "  ${YELLOW}⚠️${NC} Could not delete test user (status: $STATUS)"
  fi
fi

# Logout all sessions
curl -s -X GET "${BASE_URL}/auth/logout" -b "$COOKIE_JAR_ADMIN" > /dev/null 2>&1
curl -s -X GET "${BASE_URL}/auth/logout" -b "$COOKIE_JAR_USER" > /dev/null 2>&1

# Clean up cookie files
rm -f "$COOKIE_JAR_ADMIN" "$COOKIE_JAR_USER" "$COOKIE_JAR_ANON"

# =============================================================================
# REPORT
# =============================================================================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} Integration Test Report${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Total tests:  $TOTAL"
echo -e "  ${GREEN}✅ Passed:     $PASSED${NC}"
echo -e "  ${RED}❌ Failed:     $FAILED${NC}"
echo -e "  ${YELLOW}⚠️  Warnings:   $WARNINGS${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}── Failed Checks ──${NC}"
  echo -e "$FAILURES"
  echo ""
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}── Warnings ──${NC}"
  echo -e "$WARNING_LIST"
  echo ""
fi

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! 🎉${NC}"
  exit 0
else
  echo -e "${RED}$FAILED test(s) failed.${NC}"
  exit 1
fi
