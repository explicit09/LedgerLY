import React from 'react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ startDate, endDate, onChange }) => {
  return (
    <div className="flex space-x-2 mb-4">
      <input
        type="date"
        className="border rounded p-2"
        value={startDate}
        onChange={e => onChange({ startDate: e.target.value, endDate })}
      />
      <input
        type="date"
        className="border rounded p-2"
        value={endDate}
        onChange={e => onChange({ startDate, endDate: e.target.value })}
      />
    </div>
  );
};

export default DateRangeSelector;
