/**
 * Dashboards API Route
 * Access monitoring dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { monitoring } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('id');
    
    const dashboardManager = monitoring.getComponents().dashboards;
    
    if (dashboardId) {
      const dashboard = dashboardManager.getDashboard(dashboardId);
      
      if (!dashboard) {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        );
      }
      
      // Check permissions
      const userRole = session.user.role === 'ADMIN' ? 'admin' : 'user';
      if (!dashboard.permissions.view.includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      
      // Get widget data
      const widgetData: Record<string, any> = {};
      for (const widget of dashboard.widgets) {
        widgetData[widget.id] = dashboardManager.getWidgetData(widget.id);
      }
      
      return NextResponse.json({
        dashboard,
        widgetData,
      });
    } else {
      // Get all dashboards user has access to
      const allDashboards = dashboardManager.getAllDashboards();
      const userRole = session.user.role === 'ADMIN' ? 'admin' : 'user';
      
      const accessibleDashboards = allDashboards.filter(d => 
        d.permissions.view.includes(userRole)
      );
      
      return NextResponse.json(accessibleDashboards);
    }
  } catch (error) {
    console.error('Dashboards API error: ', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboards',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, widgets } = body;
    
    const dashboardManager = monitoring.getComponents().dashboards;
    const dashboardId = dashboardManager.createCustomDashboard(
      name,
      widgets,
      session.user.id!
    );
    
    return NextResponse.json({
      success: true,
      dashboardId,
      message: 'Custom dashboard created',
    });
  } catch (error) {
    console.error('Dashboard creation error: ', error);
    return NextResponse.json(
      {
        error: 'Failed to create dashboard',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}