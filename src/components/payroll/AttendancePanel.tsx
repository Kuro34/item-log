// src/components/payroll/AttendancePanel.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trash } from 'lucide-react';
import { Employee, Attendance } from '@/types/inventory';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getCurrentDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface AttendancePanelProps {
  employees: Employee[];
  attendance: Attendance[];
  onAdd: (att: Omit<Attendance, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

export function AttendancePanel({ employees, attendance, onAdd, onDelete }: AttendancePanelProps) {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<'present' | 'absent' | 'halfday' | 'overtime' | 'leave'>('present');
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!employeeId) return;

    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    onAdd({
      employeeId,
      employeeName: employee.name,
      date: selectedDate,
      status,
      hoursWorked: status === 'present' ? 8 : status === 'halfday' ? 4 : 0,
      overtimeHours: status === 'overtime' || overtimeHours > 0 ? overtimeHours : undefined,
      notes: notes || undefined,
    });

    // Reset form
    setEmployeeId('');
    setStatus('present');
    setOvertimeHours(0);
    setNotes('');
  };

  const activeEmployees = employees.filter(e => e.isActive !== false);
  const todayAttendance = attendance.filter(a => a.date === selectedDate);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      halfday: 'bg-yellow-100 text-yellow-800',
      overtime: 'bg-blue-100 text-blue-800',
      leave: 'bg-purple-100 text-purple-800',
    };
    return styles[status] || '';
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={getCurrentDateString()}
            />
          </div>

          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}{emp.position ? ` - ${emp.position}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present (Full Day)</SelectItem>
                <SelectItem value="halfday">Half Day</SelectItem>
                <SelectItem value="overtime">With Overtime</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(status === 'overtime' || overtimeHours > 0) && (
            <div className="space-y-2">
              <Label>Overtime Hours</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={overtimeHours}
                onChange={e => setOvertimeHours(Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Late arrival, Early leave"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!employeeId}>
            <Calendar className="mr-2 h-4 w-4" /> Mark Attendance
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance ({formatDate(selectedDate)})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todayAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records for this date
              </p>
            ) : (
              todayAttendance.map(att => (
                <div key={att.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{att.employeeName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusBadge(att.status)}>
                        {att.status}
                      </Badge>
                      {att.overtimeHours && att.overtimeHours > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          +{att.overtimeHours}h OT
                        </span>
                      )}
                    </div>
                    {att.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{att.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(att.id)}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}