import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceEntry } from '@/types/maintenance';
import { ArrowLeft, LogOut, TrendingUp, TrendingDown, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6384', '#36A2EB', '#FFCE56'];

interface AnalyticsData {
  entriesByLocation: Array<{ name: string; value: number }>;
  entriesOverTime: Array<{ date: string; entries: number }>;
  entriesByUser: Array<{ name: string; entries: number }>;
  completionRates: Array<{ status: string; count: number }>;
  averageMetrics: {
    avgDistance: number;
    avgDuration: number;
    avgOrangeRefill: number;
    avgTemperature: number;
  };
  predictions: Array<{ location: string; predictedExhaustion: string; confidence: string }>;
}

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all maintenance entries
      const { data: entriesData, error } = await supabase
        .from('maintenance_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const entries = entriesData || [];
      setEntries(entries);

      // Process data for analytics
      const processedData = processAnalyticsData(entries);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (entries: MaintenanceEntry[]): AnalyticsData => {
    // Entries by location
    const locationCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.start_location) {
        locationCounts[entry.start_location] = (locationCounts[entry.start_location] || 0) + 1;
      }
    });
    const entriesByLocation = Object.entries(locationCounts).map(([name, value]) => ({ name, value }));

    // Entries over time (last 30 days)
    const entriesOverTime: { [key: string]: number } = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.date_of_entry);
      if (entryDate >= thirtyDaysAgo) {
        const dateStr = entryDate.toISOString().split('T')[0];
        entriesOverTime[dateStr] = (entriesOverTime[dateStr] || 0) + 1;
      }
    });
    
    const entriesOverTimeArray = Object.entries(entriesOverTime)
      .map(([date, entries]) => ({ date, entries }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Entries by user
    const userCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      userCounts[entry.filled_by] = (userCounts[entry.filled_by] || 0) + 1;
    });
    const entriesByUser = Object.entries(userCounts)
      .map(([name, entries]) => ({ name, entries }))
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 10); // Top 10 users

    // Completion rates
    const completed = entries.filter(entry => entry.step3_completed).length;
    const inProgress = entries.filter(entry => !entry.step3_completed && entry.step1_completed).length;
    const notStarted = entries.filter(entry => !entry.step1_completed).length;
    const completionRates = [
      { status: 'Completed', count: completed },
      { status: 'In Progress', count: inProgress },
      { status: 'Not Started', count: notStarted }
    ];

    // Average metrics
    const completedEntries = entries.filter(entry => entry.step3_completed);
    const avgDistance = completedEntries.length > 0 
      ? completedEntries.reduce((sum, entry) => sum + (entry.distance || 0), 0) / completedEntries.length 
      : 0;
    const avgDuration = completedEntries.length > 0 
      ? completedEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / completedEntries.length 
      : 0;
    const avgOrangeRefill = completedEntries.length > 0 
      ? completedEntries.reduce((sum, entry) => sum + (entry.orange_refill || 0), 0) / completedEntries.length 
      : 0;
    const avgTemperature = completedEntries.length > 0 
      ? completedEntries.reduce((sum, entry) => sum + (entry.temperature || 0), 0) / completedEntries.length 
      : 0;

    // Predictions (simplified - based on recent usage patterns)
    const predictions = Object.keys(locationCounts).map(location => {
      const locationEntries = entries.filter(entry => entry.start_location === location);
      const recentEntries = locationEntries.filter(entry => {
        const entryDate = new Date(entry.date_of_entry);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      });
      
      const avgOrangePerEntry = recentEntries.length > 0 
        ? recentEntries.reduce((sum, entry) => sum + (entry.orange_refill || 0), 0) / recentEntries.length 
        : 0;
      
      // Simple prediction: if average orange refill is high, predict exhaustion sooner
      const daysUntilExhaustion = avgOrangePerEntry > 50 ? 3 : avgOrangePerEntry > 30 ? 5 : 7;
      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + daysUntilExhaustion);
      
      const confidence = recentEntries.length > 5 ? 'High' : recentEntries.length > 2 ? 'Medium' : 'Low';
      
      return {
        location,
        predictedExhaustion: predictedDate.toISOString().split('T')[0],
        confidence
      };
    });

    return {
      entriesByLocation,
      entriesOverTime: entriesOverTimeArray,
      entriesByUser,
      completionRates,
      averageMetrics: {
        avgDistance: Math.round(avgDistance * 100) / 100,
        avgDuration: Math.round(avgDuration * 100) / 100,
        avgOrangeRefill: Math.round(avgOrangeRefill * 100) / 100,
        avgTemperature: Math.round(avgTemperature * 100) / 100
      },
      predictions
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics & Predictions</h1>
              <p className="text-muted-foreground">Data insights and machine predictions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{user?.displayName}</span>
            </div>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{entries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {entries.filter(e => e.step3_completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">
                    {analyticsData?.averageMetrics.avgDuration || 0} min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Orange Refill</p>
                  <p className="text-2xl font-bold">
                    {analyticsData?.averageMetrics.avgOrangeRefill || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Pie Chart: Entries by Location */}
          <Card>
            <CardHeader>
              <CardTitle>Entries by Location</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={analyticsData?.entriesByLocation || []} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(analyticsData?.entriesByLocation || []).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart: Entries Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Entries Over Time (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.entriesOverTime || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="entries" stroke="#0088FE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Bar Chart: Top Users */}
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Entries</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.entriesByUser || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entries" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Completion Status</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={analyticsData?.completionRates || []} 
                    dataKey="count" 
                    nameKey="status" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {(analyticsData?.completionRates || []).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Orange Exhaustion Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              {analyticsData?.predictions.map((pred) => (
                <div key={pred.location} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{pred.location}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      pred.confidence === 'High' ? 'bg-green-100 text-green-800' :
                      pred.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pred.confidence} Confidence
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-orange-600">
                    {new Date(pred.predictedExhaustion).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Predicted exhaustion date
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <b>Note:</b> Predictions are based on recent usage patterns and orange refill data. 
              Confidence levels indicate the reliability of the prediction based on available data points.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics; 