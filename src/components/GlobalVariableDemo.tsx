import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User, Settings, Database, Globe } from 'lucide-react';
import { demonstrateGlobalVariableFlow, exampleScenarios, logGlobalVariables } from '../lib/globalVariables';

const GlobalVariableDemo: React.FC = () => {
  const { 
    userId, 
    ownerId, 
    username, 
    role, 
    email, 
    fullName, 
    isAuthenticated,
    refreshGlobalVariables 
  } = useAuth();

  const [showDemo, setShowDemo] = useState(false);

  const currentGlobalVars = {
    userId,
    ownerId,
    username,
    role,
    email,
    fullName
  };

  const handleShowConsoleDemo = () => {
    demonstrateGlobalVariableFlow();
    setShowDemo(true);
  };

  const handleLogCurrentVars = () => {
    logGlobalVariables(currentGlobalVars, 'Current User');
    refreshGlobalVariables();
  };

  const getStatusColor = (value: string | null) => {
    return value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Dynamic Global Variables Demo
        </CardTitle>
        <CardDescription>
          See how global variables (userId, ownerId, username, role) update automatically when different users log in
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Global Variables */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Current Global Variables
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">User ID</span>
              <Badge className={getStatusColor(userId)}>
                {userId || 'Not Set'}
              </Badge>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Owner ID</span>
              <Badge className={getStatusColor(ownerId)}>
                {ownerId || 'Not Set'}
              </Badge>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Username</span>
              <Badge className={getStatusColor(username)}>
                {username || 'Not Set'}
              </Badge>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Role</span>
              <Badge className={getStatusColor(role)}>
                {role || 'Not Set'}
              </Badge>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Email</span>
              <Badge className={getStatusColor(email)}>
                {email ? email.substring(0, 20) + (email.length > 20 ? '...' : '') : 'Not Set'}
              </Badge>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Full Name</span>
              <Badge className={getStatusColor(fullName)}>
                {fullName || 'Not Set'}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Authentication Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
            </p>
            {isAuthenticated && ownerId && (
              <p className="text-sm text-blue-700 mt-1">
                When you create events, they will automatically get <code>ownerId: "{ownerId}"</code>
              </p>
            )}
          </div>
        </div>

        {/* Example Scenarios */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Example User Scenarios
          </h3>
          
          <div className="space-y-3">
            {Object.entries(exampleScenarios).map(([key, scenario]) => (
              <div key={key} className="p-3 bg-white rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-md">{scenario.fullName}</h4>
                    <p className="text-sm text-gray-600">@{scenario.username} • {scenario.role}</p>
                  </div>
                  <Badge variant="outline">
                    Owner ID: {scenario.ownerId}
                  </Badge>
                </div>
                
                <div className="mt-2 text-sm text-gray-700">
                  <p>📧 {scenario.email}</p>
                  <p className="mt-1">
                    🎪 <strong>When {scenario.fullName} logs in:</strong> All events created will have <code>ownerId: "{scenario.ownerId}"</code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            How Dynamic Global Variables Work
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">1.</span>
              <span>User logs in → JWT token created with user-specific data</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">2.</span>
              <span>AuthContext extracts global variables from user data</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">3.</span>
              <span>Global variables update automatically across the app</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">4.</span>
              <span>Event creation uses current user's ownerId automatically</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600">5.</span>
              <span>Each user only sees events with their ownerId</span>
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={handleLogCurrentVars}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Log Current Variables
          </Button>
          
          <Button 
            onClick={handleShowConsoleDemo}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Show Console Demo
          </Button>
        </div>

        {showDemo && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              ✅ Demo logged to console! Open developer tools (F12) to see the complete global variable flow demonstration.
            </p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
          <strong>💡 Pro Tip:</strong> Open the browser console and watch the logs when you log in/out to see how global variables change in real-time!
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalVariableDemo; 