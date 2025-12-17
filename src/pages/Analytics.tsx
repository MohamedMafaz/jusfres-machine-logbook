import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceEntry } from '@/types/maintenance';
import {
  ArrowLeft, LogOut, TrendingUp, TrendingDown,
  Clock, MapPin, AlertTriangle, Activity,
  Calendar, Apple, Citrus, Info, Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // New Metrics
  issuesByMachine: Array<{ machine: string; count: number }>;
  mtbfByMachine: Array<{ machine: string; days: number }>; // Changed to days
  mttrByMachine: Array<{ machine: string; minutes: number }>;
  consumptionData: Array<{ date: string; apples: number; oranges: number }>;
  maintenanceRecommendations: Array<{ machine: string; reason: string; urgency: 'High' | 'Medium' | 'Low'; predictedDate?: string }>;
}

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // State for interactive dialog
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [machineIssues, setMachineIssues] = useState<MaintenanceEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for Time Range Filter
  const [timeRange, setTimeRange] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]); // Re-fetch/re-process when timeRange changes

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
      const processedData = processAnalyticsData(entries, timeRange);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (entries: MaintenanceEntry[], range: string): AnalyticsData => {
    // Helper to filter entries by time range
    const filterByRange = (entryDate: string) => {
      if (range === 'all') return true;
      const date = new Date(entryDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (range) {
        case '7d': return diffDays <= 7;
        case '30d': return diffDays <= 30;
        case '90d': return diffDays <= 90;
        case '1y': return diffDays <= 365;
        default: return true;
      }
    };

    // Helper to group entries by machine (end_location for issues)
    const entriesByMachineEnd: { [key: string]: MaintenanceEntry[] } = {};

    entries.forEach(entry => {
      if (entry.end_location) {
        if (!entriesByMachineEnd[entry.end_location]) {
          entriesByMachineEnd[entry.end_location] = [];
        }
        entriesByMachineEnd[entry.end_location].push(entry);
      }
    });

    // 1. Existing Metrics
    const locationCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.start_location) {
        locationCounts[entry.start_location] = (locationCounts[entry.start_location] || 0) + 1;
      }
    });
    const entriesByLocation = Object.entries(locationCounts).map(([name, value]) => ({ name, value }));

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

    const userCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      userCounts[entry.filled_by] = (userCounts[entry.filled_by] || 0) + 1;
    });
    const entriesByUser = Object.entries(userCounts)
      .map(([name, entries]) => ({ name, entries }))
      .sort((a, b) => b.entries - a.entries)
      .slice(0, 10);

    const completed = entries.filter(entry => entry.step3_completed).length;
    const inProgress = entries.filter(entry => !entry.step3_completed && entry.step1_completed).length;
    const notStarted = entries.filter(entry => !entry.step1_completed).length;
    const completionRates = [
      { status: 'Completed', count: completed },
      { status: 'In Progress', count: inProgress },
      { status: 'Not Started', count: notStarted }
    ];

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

    // 2. Issue Analysis (Using end_location and Time Range)
    const issuesByMachine: Array<{ machine: string; count: number }> = [];
    Object.entries(entriesByMachineEnd).forEach(([machine, machineEntries]) => {
      // Filter by time range AND step3_completed (as per user request "if these is step 3/3 that is completed")
      const issueCount = machineEntries.filter(e =>
        e.step3_completed &&
        e.issues_errors &&
        e.issues_errors.trim() !== '' &&
        filterByRange(e.date_of_entry)
      ).length;

      if (issueCount > 0) {
        issuesByMachine.push({ machine, count: issueCount });
      }
    });
    issuesByMachine.sort((a, b) => b.count - a.count);

    // 3. MTBF & MTTR (Using end_location)
    const mtbfByMachine: Array<{ machine: string; days: number }> = [];
    const mttrByMachine: Array<{ machine: string; minutes: number }> = [];
    const maintenanceRecommendations: Array<{ machine: string; reason: string; urgency: 'High' | 'Medium' | 'Low'; predictedDate?: string }> = [];

    Object.entries(entriesByMachineEnd).forEach(([machine, machineEntries]) => {
      // Sort by date ascending
      const sortedEntries = [...machineEntries].sort((a, b) =>
        new Date(a.date_of_entry).getTime() - new Date(b.date_of_entry).getTime()
      );

      const issueEntries = sortedEntries.filter(e => e.issues_errors && e.issues_errors.trim() !== '');

      // MTBF (in Days)
      if (issueEntries.length >= 2) {
        let totalDiffDays = 0;
        for (let i = 1; i < issueEntries.length; i++) {
          const prev = new Date(issueEntries[i - 1].date_of_entry);
          const curr = new Date(issueEntries[i].date_of_entry);
          const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          totalDiffDays += diffDays;
        }
        const mtbfDays = totalDiffDays / (issueEntries.length - 1);
        mtbfByMachine.push({ machine, days: Math.round(mtbfDays * 10) / 10 }); // Round to 1 decimal

        // Prediction: Next Issue
        const lastIssueDate = new Date(issueEntries[issueEntries.length - 1].date_of_entry);
        const nextIssueDate = new Date(lastIssueDate.getTime() + (mtbfDays * 24 * 60 * 60 * 1000));

        // Add recommendation if next issue is soon (within 3 days)
        const daysUntilIssue = (nextIssueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);

        if (daysUntilIssue <= 3 && daysUntilIssue >= 0) {
          maintenanceRecommendations.push({
            machine,
            reason: `Predicted failure in ${Math.ceil(daysUntilIssue)} days based on MTBF`,
            urgency: daysUntilIssue <= 1 ? 'High' : 'Medium',
            predictedDate: nextIssueDate.toISOString().split('T')[0]
          });
        } else if (daysUntilIssue < 0) {
          maintenanceRecommendations.push({
            machine,
            reason: `Overdue for maintenance based on MTBF`,
            urgency: 'High',
            predictedDate: nextIssueDate.toISOString().split('T')[0]
          });
        }
      }

      // MTTR (Using time_spent_machine or duration_minutes as proxy for repair time)
      if (issueEntries.length > 0) {
        const totalRepairTime = issueEntries.reduce((sum, e) => sum + (e.time_spent_machine || e.duration_minutes || 0), 0);
        const mttr = totalRepairTime / issueEntries.length;
        mttrByMachine.push({ machine, minutes: Math.round(mttr) });
      }

      // Recommend if too many issues recently
      const recentIssues = issueEntries.filter(e => {
        const d = new Date(e.date_of_entry);
        const now = new Date();
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }).length;

      if (recentIssues >= 3) {
        maintenanceRecommendations.push({
          machine,
          reason: `${recentIssues} issues reported in the last 7 days`,
          urgency: 'High'
        });
      }
    });

    // 4. Consumption Analysis
    const consumptionMap: { [key: string]: { apples: number; oranges: number } } = {};
    entries.forEach(entry => {
      const date = entry.date_of_entry.split('T')[0]; // Assuming YYYY-MM-DD
      if (!consumptionMap[date]) {
        consumptionMap[date] = { apples: 0, oranges: 0 };
      }
      consumptionMap[date].apples += (entry as any).apples_placed || 0;
      consumptionMap[date].oranges += (entry as any).oranges_placed || 0;
    });

    const consumptionData = Object.entries(consumptionMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    // Forecast Consumption (Simple Moving Average of last 3 days)
    if (consumptionData.length >= 3) {
      const last3 = consumptionData.slice(-3);
      const avgApples = last3.reduce((sum, d) => sum + d.apples, 0) / 3;
      const avgOranges = last3.reduce((sum, d) => sum + d.oranges, 0) / 3;

      // Add forecast for next 3 days
      const lastDate = new Date(consumptionData[consumptionData.length - 1].date);
      for (let i = 1; i <= 3; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + i);
        consumptionData.push({
          date: `${nextDate.toISOString().split('T')[0]} (Forecast)`,
          apples: Math.round(avgApples),
          oranges: Math.round(avgOranges)
        });
      }
    }

    // Existing Predictions Logic (Preserved)
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
      predictions,
      issuesByMachine,
      mtbfByMachine,
      mttrByMachine,
      consumptionData,
      maintenanceRecommendations: Array.from(new Set(maintenanceRecommendations.map(JSON.stringify))).map(JSON.parse) // Deduplicate
    };
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const machineName = data.activePayload[0].payload.machine;
      if (machineName) {
        setSelectedMachine(machineName);

        // Filter issues for this machine (using end_location)
        const issues = entries.filter(e =>
          e.end_location === machineName &&
          e.issues_errors &&
          e.issues_errors.trim() !== ''
        ).sort((a, b) => new Date(b.date_of_entry).getTime() - new Date(a.date_of_entry).getTime());

        setMachineIssues(issues);
        setIsDialogOpen(true);
      }
    }
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

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues & Maintenance</TabsTrigger>
            <TabsTrigger value="consumption">Consumption</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                    <Activity className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg MTTR</p>
                      <p className="text-2xl font-bold">
                        {analyticsData?.mttrByMachine.length ?
                          Math.round(analyticsData.mttrByMachine.reduce((a, b) => a + b.minutes, 0) / analyticsData.mttrByMachine.length)
                          : 0} min
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {/* Legend */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  <span className="font-semibold mr-1">MTBF:</span> Mean Time Between Failures (Avg days between issues)
                </div>
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  <span className="font-semibold mr-1">MTTR:</span> Mean Time To Repair (Avg minutes to resolve issues)
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {analyticsData?.maintenanceRecommendations && analyticsData.maintenanceRecommendations.length > 0 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Recommended Maintenance
                  </CardTitle>
                  <CardDescription>Machines requiring attention based on predictive analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {analyticsData.maintenanceRecommendations.map((rec, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{rec.machine}</h4>
                          <Badge variant={rec.urgency === 'High' ? 'destructive' : 'secondary'}>
                            {rec.urgency} Priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                        {rec.predictedDate && (
                          <div className="flex items-center text-xs font-medium text-orange-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            Expected: {rec.predictedDate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Issues per Machine</CardTitle>
                    <CardDescription>Machines with most reported issues</CardDescription>
                  </div>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 3 Months</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                      <SelectItem value="all">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData?.issuesByMachine || []}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      onClick={handleBarClick}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="machine" type="category" width={100} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="count" fill="#FF8042" name="Issues" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mean Time Between Failures (MTBF)</CardTitle>
                  <CardDescription>Average days between reported issues</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.mtbfByMachine || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="machine" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="days" fill="#00C49F" name="Days" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="consumption" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consumption Analysis & Forecast</CardTitle>
                <CardDescription>Daily consumption of Apples vs Oranges (with 3-day forecast)</CardDescription>
              </CardHeader>
              <CardContent style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.consumptionData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApples" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOranges" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="apples" stroke="#8884d8" fillOpacity={1} fill="url(#colorApples)" name="Apples Placed" />
                    <Area type="monotone" dataKey="oranges" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOranges)" name="Oranges Placed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Apple className="w-5 h-5 mr-2 text-red-500" />
                    Total Apples Consumed (Last 14 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {analyticsData?.consumptionData.filter(d => !d.date.includes('Forecast')).reduce((sum, d) => sum + d.apples, 0)}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Forecast for next 3 days: {analyticsData?.consumptionData.filter(d => d.date.includes('Forecast')).reduce((sum, d) => sum + d.apples, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Citrus className="w-5 h-5 mr-2 text-orange-500" />
                    Total Oranges Consumed (Last 14 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {analyticsData?.consumptionData.filter(d => !d.date.includes('Forecast')).reduce((sum, d) => sum + d.oranges, 0)}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Forecast for next 3 days: {analyticsData?.consumptionData.filter(d => d.date.includes('Forecast')).reduce((sum, d) => sum + d.oranges, 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Drill-down Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Issue History: {selectedMachine}</DialogTitle>
              <DialogDescription>
                Recent issues reported for this machine.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {machineIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No issues found.</p>
              ) : (
                <div className="space-y-4">
                  {machineIssues.map((issue) => (
                    <div key={issue.id} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">
                          {new Date(issue.date_of_entry).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {issue.filled_by}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {issue.issues_errors}
                      </p>
                      {issue.tasks_completed && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Action: {issue.tasks_completed}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Analytics;