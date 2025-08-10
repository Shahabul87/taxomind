import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Scan,
  FileText,
  Lock,
  Eye,
  Settings,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';

export default async function CompliancePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Compliance Dashboard
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Enterprise security, privacy, and compliance management
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-green-600">87%</p>
                  <p className="text-sm text-gray-600">Security Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle2 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">SOC2</p>
                  <p className="text-sm text-gray-600">Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Lock className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">GDPR</p>
                  <p className="text-sm text-gray-600">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">3</p>
                  <p className="text-sm text-gray-600">Pending Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="gdpr" className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>GDPR</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Audit Logs</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Compliance Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status Overview</CardTitle>
                  <CardDescription>
                    Current compliance status across all frameworks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-green-900">SOC2 Type II</h3>
                          <p className="text-sm text-green-700">Last audit: December 2024</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Compliant
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Lock className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-blue-900">GDPR</h3>
                          <p className="text-sm text-blue-700">Data protection ready</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Ready
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-yellow-900">OWASP Security</h3>
                          <p className="text-sm text-yellow-700">3 vulnerabilities need attention</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Action Required
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Events</CardTitle>
                  <CardDescription>
                    Latest security and compliance activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border-l-4 border-green-400 bg-green-50">
                      <div className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium">Dependency scan completed</p>
                          <p className="text-sm text-gray-600">No critical vulnerabilities found</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">2 hours ago</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border-l-4 border-blue-400 bg-blue-50">
                      <div className="flex items-center">
                        <Activity className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">Audit log generated</p>
                          <p className="text-sm text-gray-600">SOC2 compliance report created</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">6 hours ago</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border-l-4 border-yellow-400 bg-yellow-50">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                        <div>
                          <p className="font-medium">Security alert</p>
                          <p className="text-sm text-gray-600">Multiple failed login attempts detected</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">12 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              {/* Security Scan Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Scan Results</CardTitle>
                  <CardDescription>
                    OWASP dependency check and vulnerability assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">8 Issues Found</p>
                      <p className="text-sm text-gray-600">Last scan: 2 hours ago</p>
                    </div>
                    <Button className="flex items-center space-x-2">
                      <Scan className="w-4 h-4" />
                      <span>Run New Scan</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">1</p>
                      <p className="text-sm text-red-700">Critical</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">2</p>
                      <p className="text-sm text-orange-700">High</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">3</p>
                      <p className="text-sm text-yellow-700">Medium</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">2</p>
                      <p className="text-sm text-blue-700">Low</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border-l-4 border-red-400 bg-red-50">
                      <div>
                        <p className="font-medium text-red-900">SQL Injection Vulnerability</p>
                        <p className="text-sm text-red-700">Found in user search endpoint</p>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border-l-4 border-orange-400 bg-orange-50">
                      <div>
                        <p className="font-medium text-orange-900">Missing CSRF Protection</p>
                        <p className="text-sm text-orange-700">State-changing operations unprotected</p>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border-l-4 border-yellow-400 bg-yellow-50">
                      <div>
                        <p className="font-medium text-yellow-900">Weak Session Management</p>
                        <p className="text-sm text-yellow-700">30-day session timeout too long</p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Penetration Test Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Penetration Test Results</CardTitle>
                  <CardDescription>
                    Automated security testing results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-3xl font-bold text-blue-600">B+</p>
                      <p className="text-sm text-gray-600">Security Grade (87/100)</p>
                    </div>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download Report</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Authentication Security</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Passed</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Input Validation</span>
                      <Badge variant="destructive">Failed</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Session Management</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Protection</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Passed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gdpr">
            <div className="space-y-6">
              {/* GDPR Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle>GDPR Compliance Dashboard</CardTitle>
                  <CardDescription>
                    Data protection and privacy management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">1,247</p>
                      <p className="text-sm text-blue-700">Total Users</p>
                    </div>
                    
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">1,198</p>
                      <p className="text-sm text-green-700">Active Consents</p>
                    </div>
                    
                    <div className="text-center p-6 bg-yellow-50 rounded-lg">
                      <FileText className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">12</p>
                      <p className="text-sm text-yellow-700">Data Requests</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">Recent GDPR Requests</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">Data Export Request</p>
                          <p className="text-sm text-gray-600">user@example.com</p>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">Account Deletion Request</p>
                          <p className="text-sm text-gray-600">john@example.com</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <div className="space-y-6">
              {/* Audit Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>SOC2 Audit Logs</CardTitle>
                  <CardDescription>
                    Comprehensive audit trail for compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">User Login Success</p>
                          <p className="text-sm text-gray-600">admin@taxomind.com - IP: 192.168.1.100</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">2:30 PM</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">Data Access</p>
                          <p className="text-sm text-gray-600">Course data accessed - ID: course_123</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">2:28 PM</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">Failed Login Attempt</p>
                          <p className="text-sm text-gray-600">user@example.com - IP: 203.0.113.1</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">2:25 PM</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Export Full Audit Log
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Compliance Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>
                    Generate and download compliance reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg">
                      <h3 className="font-semibold mb-2">SOC2 Type II Report</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Comprehensive security controls assessment
                      </p>
                      <Button className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                    
                    <div className="p-6 border rounded-lg">
                      <h3 className="font-semibold mb-2">GDPR Compliance Report</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Data protection and privacy compliance status
                      </p>
                      <Button className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                    
                    <div className="p-6 border rounded-lg">
                      <h3 className="font-semibold mb-2">Security Assessment</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        OWASP and penetration testing results
                      </p>
                      <Button className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                    
                    <div className="p-6 border rounded-lg">
                      <h3 className="font-semibold mb-2">Audit Trail Summary</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Complete audit log summary and analysis
                      </p>
                      <Button className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Compliance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Settings</CardTitle>
                  <CardDescription>
                    Configure security and compliance parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Automated Scanning</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Daily Security Scans</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>OWASP Dependency Check</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Penetration Testing</span>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Weekly</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Data Retention</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Audit Logs</span>
                          <span className="text-sm text-gray-600">7 years</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>User Data</span>
                          <span className="text-sm text-gray-600">3 years after deletion</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Analytics Data</span>
                          <span className="text-sm text-gray-600">2 years</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Alert Configuration</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Security Alerts</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Real-time</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Compliance Reports</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Monthly</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Vulnerability Notifications</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Immediate</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-6">
                    <Settings className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}