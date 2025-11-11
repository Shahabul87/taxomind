#!/bin/bash

# Production Endpoint Testing Script
# Tests critical endpoints to verify deployment

PRODUCTION_URL="https://taxomind.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Production Endpoints"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_URL}/api/health")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health Check: PASSED${NC} (HTTP $HEALTH_STATUS)"
else
    echo -e "${RED}❌ Health Check: FAILED${NC} (HTTP $HEALTH_STATUS)"
fi
echo ""

# Test 2: Dashboard Activities API (requires auth - will return 401 or 500)
echo "2️⃣  Testing Dashboard Activities API..."
ACTIVITIES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_URL}/api/dashboard/activities?page=1&limit=20")
if [ "$ACTIVITIES_STATUS" = "401" ] || [ "$ACTIVITIES_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Activities API: ACCESSIBLE${NC} (HTTP $ACTIVITIES_STATUS - Expected 401 without auth)"
elif [ "$ACTIVITIES_STATUS" = "500" ]; then
    echo -e "${RED}❌ Activities API: SERVER ERROR${NC} (HTTP $ACTIVITIES_STATUS - Database issue)"
else
    echo -e "${YELLOW}⚠️  Activities API: UNKNOWN${NC} (HTTP $ACTIVITIES_STATUS)"
fi
echo ""

# Test 3: Certificates Page
echo "3️⃣  Testing Certificates Page..."
CERT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_URL}/certificates")
if [ "$CERT_STATUS" = "200" ] || [ "$CERT_STATUS" = "307" ] || [ "$CERT_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ Certificates Page: ACCESSIBLE${NC} (HTTP $CERT_STATUS)"
elif [ "$CERT_STATUS" = "404" ]; then
    echo -e "${RED}❌ Certificates Page: NOT FOUND${NC} (HTTP $CERT_STATUS)"
else
    echo -e "${YELLOW}⚠️  Certificates Page: UNKNOWN${NC} (HTTP $CERT_STATUS)"
fi
echo ""

# Test 4: Favorites Page
echo "4️⃣  Testing Favorites Page..."
FAV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_URL}/favorites")
if [ "$FAV_STATUS" = "200" ] || [ "$FAV_STATUS" = "307" ] || [ "$FAV_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ Favorites Page: ACCESSIBLE${NC} (HTTP $FAV_STATUS)"
elif [ "$FAV_STATUS" = "404" ]; then
    echo -e "${RED}❌ Favorites Page: NOT FOUND${NC} (HTTP $FAV_STATUS)"
else
    echo -e "${YELLOW}⚠️  Favorites Page: UNKNOWN${NC} (HTTP $FAV_STATUS)"
fi
echo ""

# Test 5: Dashboard Page
echo "5️⃣  Testing Dashboard Page..."
DASH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PRODUCTION_URL}/dashboard")
if [ "$DASH_STATUS" = "200" ] || [ "$DASH_STATUS" = "307" ] || [ "$DASH_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ Dashboard Page: ACCESSIBLE${NC} (HTTP $DASH_STATUS)"
elif [ "$DASH_STATUS" = "500" ]; then
    echo -e "${RED}❌ Dashboard Page: SERVER ERROR${NC} (HTTP $DASH_STATUS)"
else
    echo -e "${YELLOW}⚠️  Dashboard Page: UNKNOWN${NC} (HTTP $DASH_STATUS)"
fi
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo ""

if [ "$HEALTH_STATUS" = "200" ] && [ "$ACTIVITIES_STATUS" != "500" ] && [ "$CERT_STATUS" != "404" ] && [ "$FAV_STATUS" != "404" ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Login to https://taxomind.com/dashboard"
    echo "2. Check browser console for errors"
    echo "3. Verify activities load without 500 errors"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Issues found:"
    [ "$HEALTH_STATUS" != "200" ] && echo "  - Health check failed"
    [ "$ACTIVITIES_STATUS" = "500" ] && echo "  - Activities API returning 500 errors"
    [ "$CERT_STATUS" = "404" ] && echo "  - Certificates page not found"
    [ "$FAV_STATUS" = "404" ] && echo "  - Favorites page not found"
    echo ""
    echo "Check Railway logs: railway logs --deployment"
fi

echo ""
