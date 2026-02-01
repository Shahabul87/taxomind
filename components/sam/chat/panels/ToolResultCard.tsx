"use client";

import React from 'react';
import {
  Calculator,
  BookOpen,
  Globe,
  Search,
  Link2,
  FileText,
  Lightbulb,
  Calendar,
  Clock,
  CalendarCheck,
  ListChecks,
  Bell,
  BellRing,
  CheckCircle2,
  BarChart3,
  Trophy,
  Star,
  AlertCircle,
  XCircle,
  Wrench,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ToolResultCardProps {
  toolId: string;
  toolName: string;
  result: unknown;
  status: string;
}

// =============================================================================
// SAFE DATA HELPERS
// =============================================================================

function asRecord(val: unknown): Record<string, unknown> {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

function safeStr(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

function safeNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
}

function safeArr(val: unknown): unknown[] {
  return Array.isArray(val) ? val : [];
}

/** Unwrap { success, output } wrapper common in tool responses */
function extractOutput(result: unknown): unknown {
  const rec = asRecord(result);
  if ('output' in rec) return rec.output;
  if ('result' in rec) return rec.result;
  if ('data' in rec) return rec.data;
  return result;
}

// =============================================================================
// CARD SHELL
// =============================================================================

const cardStyle: React.CSSProperties = {
  background: 'var(--sam-surface)',
  border: '1px solid var(--sam-border)',
  borderLeft: '3px solid var(--sam-accent)',
  borderRadius: 10,
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderBottom: '1px solid var(--sam-border)',
};

const bodyStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 11,
  lineHeight: 1.6,
  color: 'var(--sam-text)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--sam-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  fontWeight: 600,
};

const separatorStyle: React.CSSProperties = {
  borderTop: '1px solid var(--sam-border)',
  margin: '8px 0',
};

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={headerStyle}>
      <span style={{ color: 'var(--sam-accent)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sam-text)' }}>{title}</span>
        {subtitle && (
          <span style={{ fontSize: 10, color: 'var(--sam-text-muted)', marginLeft: 6 }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}

function CardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '6px 12px 8px', borderTop: '1px solid var(--sam-border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--sam-text-muted)' }}>
      {children}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 9,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 4,
        background: (color ?? 'var(--sam-accent)') + '18',
        color: color ?? 'var(--sam-accent)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.03em',
      }}
    >
      {children}
    </span>
  );
}

// =============================================================================
// FAILED CARD
// =============================================================================

function FailedCard({ toolName }: { toolName: string }) {
  return (
    <div style={{ ...cardStyle, borderLeftColor: 'var(--sam-error, #ef4444)' }}>
      <CardHeader icon={<XCircle className="h-4 w-4" style={{ color: 'var(--sam-error, #ef4444)' }} />} title={`${toolName} Failed`} />
      <div style={bodyStyle}>
        <p style={{ color: 'var(--sam-error, #ef4444)' }}>The tool encountered an error. Please try again or adjust the inputs.</p>
      </div>
    </div>
  );
}

// =============================================================================
// CALCULATOR CARD
// =============================================================================

function CalculatorCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const expression = safeStr(d.expression ?? d.input);
  const result = d.result ?? d.value ?? d.answer ?? data;
  const resultStr = typeof result === 'number' ? String(result) : safeStr(result);

  return (
    <div style={cardStyle}>
      <CardHeader icon={<Calculator className="h-4 w-4" />} title="Calculator" />
      <div style={bodyStyle}>
        {expression && (
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--sam-text-secondary)', marginBottom: 4 }}>{expression}</p>
        )}
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--sam-accent)', fontFamily: 'monospace' }}>
          = {resultStr}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// DICTIONARY CARD
// =============================================================================

function DictionaryCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const word = safeStr(d.word);
  const phonetic = safeStr(d.phonetic);

  // Build groups: [{ partOfSpeech, defs: string[] }]
  // Handles two formats:
  //   Nested (raw API):  { meanings: [{ partOfSpeech, definitions: [{ definition }] }] }
  //   Flat (our backend): { definitions: [{ partOfSpeech, definition }] }
  const rawMeanings = safeArr(d.meanings);
  const rawDefs = safeArr(d.definitions);

  const groups: Array<{ pos: string; defs: string[] }> = [];

  if (rawMeanings.length > 0) {
    // Nested format — each meaning has a definitions sub-array
    for (const m of rawMeanings.slice(0, 4)) {
      const meaning = asRecord(m);
      const pos = safeStr(meaning.partOfSpeech);
      const innerDefs = safeArr(meaning.definitions);
      const texts = innerDefs
        .map((dd) => safeStr(asRecord(dd).definition ?? dd))
        .filter(Boolean);
      if (texts.length > 0 || pos) groups.push({ pos, defs: texts });
    }
  } else if (rawDefs.length > 0) {
    // Flat format — group by partOfSpeech to avoid repeated badges
    const byPos = new Map<string, string[]>();
    for (const item of rawDefs) {
      const obj = asRecord(item);
      const pos = safeStr(obj.partOfSpeech) || 'other';
      const text = safeStr(obj.definition);
      if (!text) continue;
      if (!byPos.has(pos)) byPos.set(pos, []);
      byPos.get(pos)!.push(text);
    }
    for (const [pos, defs] of byPos) {
      groups.push({ pos: pos === 'other' ? '' : pos, defs });
    }
  }

  return (
    <div style={cardStyle}>
      <CardHeader
        icon={<BookOpen className="h-4 w-4" />}
        title={word || 'Definition'}
        subtitle={phonetic ? `/${phonetic}/` : undefined}
      />
      <div style={bodyStyle}>
        {groups.length > 0 ? (
          groups.map((group, i) => (
            <div key={i} style={{ marginBottom: i < groups.length - 1 ? 8 : 0 }}>
              {group.pos && <Badge>{group.pos}</Badge>}
              {group.defs.slice(0, 4).map((text, j) => (
                <p key={j} style={{ margin: '3px 0', paddingLeft: 8 }}>
                  <span style={{ color: 'var(--sam-text-muted)', marginRight: 4 }}>{j + 1}.</span>
                  {text}
                </p>
              ))}
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--sam-text-muted)' }}>
            {typeof data === 'string' ? data : 'No definitions found.'}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WIKIPEDIA CARD
// =============================================================================

function WikipediaCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const title = safeStr(d.title ?? d.name);
  const extract = safeStr(d.extract ?? d.summary ?? d.content ?? d.description);
  const url = safeStr(d.url ?? d.link);
  const truncatedExtract = extract.length > 300 ? extract.slice(0, 300) + '...' : extract;

  return (
    <div style={cardStyle}>
      <CardHeader icon={<Globe className="h-4 w-4" />} title={title || 'Wikipedia'} />
      <div style={bodyStyle}>
        <p>{truncatedExtract || 'No extract available.'}</p>
      </div>
      {url && (
        <CardFooter>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--sam-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}
          >
            <ExternalLink className="h-3 w-3" />
            Read on Wikipedia
            <ArrowUpRight className="h-2.5 w-2.5" />
          </a>
        </CardFooter>
      )}
    </div>
  );
}

// =============================================================================
// SEARCH RESULTS CARD
// =============================================================================

function SearchResultsCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const query = safeStr(d.query ?? d.searchQuery);
  const results = safeArr(d.results ?? d.items ?? d.hits ?? data);

  return (
    <div style={cardStyle}>
      <CardHeader
        icon={<Search className="h-4 w-4" />}
        title="Web Search"
        subtitle={query ? `"${query}"` : undefined}
      />
      <div style={{ ...bodyStyle, padding: 0 }}>
        {results.length > 0 ? (
          results.slice(0, 5).map((r, i) => {
            const item = asRecord(r);
            const title = safeStr(item.title ?? item.name);
            const snippet = safeStr(item.snippet ?? item.description ?? item.content);
            const url = safeStr(item.url ?? item.link);
            const source = url ? new URL(url).hostname.replace('www.', '') : '';
            return (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderBottom: i < results.length - 1 ? '1px solid var(--sam-border)' : 'none',
                }}
              >
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sam-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 11 }}>
                    {title || url}
                  </a>
                ) : (
                  <span style={{ fontWeight: 600, fontSize: 11 }}>{title}</span>
                )}
                {source && (
                  <span style={{ fontSize: 9, color: 'var(--sam-text-muted)', marginLeft: 6 }}>{source}</span>
                )}
                {snippet && (
                  <p style={{ fontSize: 10, color: 'var(--sam-text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                    {snippet.length > 120 ? snippet.slice(0, 120) + '...' : snippet}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p style={{ padding: '10px 12px', color: 'var(--sam-text-muted)' }}>No results found.</p>
        )}
      </div>
      <CardFooter>
        <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
      </CardFooter>
    </div>
  );
}

// =============================================================================
// URL FETCH CARD
// =============================================================================

function UrlFetchCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const title = safeStr(d.title ?? d.name);
  const url = safeStr(d.url ?? d.link);
  const content = safeStr(d.content ?? d.text ?? d.body);
  const contentType = safeStr(d.contentType ?? d.type);
  const length = safeNum(d.length ?? d.size ?? content.length);
  const source = url ? (() => { try { return new URL(url).hostname; } catch { return url; } })() : '';
  const truncated = content.length > 300 ? content.slice(0, 300) + '...' : content;

  return (
    <div style={cardStyle}>
      <CardHeader icon={<Link2 className="h-4 w-4" />} title="URL Content" />
      <div style={bodyStyle}>
        {title && <p style={{ fontWeight: 600, marginBottom: 2 }}>{title}</p>}
        {source && <p style={{ fontSize: 10, color: 'var(--sam-text-muted)', marginBottom: 6 }}>{source}</p>}
        {truncated && <p style={{ whiteSpace: 'pre-wrap' }}>{truncated}</p>}
      </div>
      <CardFooter>
        {length > 0 && <span>{length.toLocaleString()} chars</span>}
        {contentType && <span>{contentType}</span>}
      </CardFooter>
    </div>
  );
}

// =============================================================================
// CONTENT CARD (generate / summarize)
// =============================================================================

function ContentCard({ data, type }: { data: unknown; type: 'generate' | 'summarize' }) {
  const d = asRecord(data);
  const content = safeStr(d.content ?? d.text ?? d.summary ?? d.generated ?? data);
  const contentType = safeStr(d.type ?? type);
  const difficulty = safeStr(d.difficulty);
  const wordCount = safeNum(d.wordCount ?? d.words) || (content ? content.split(/\s+/).length : 0);
  const readTime = Math.max(1, Math.round(wordCount / 200));
  const truncated = content.length > 600 ? content.slice(0, 600) + '...' : content;
  const isGenerate = type === 'generate';

  return (
    <div style={cardStyle}>
      <CardHeader
        icon={<FileText className="h-4 w-4" />}
        title={isGenerate ? `Generated ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}` : 'Summary'}
      />
      <div style={bodyStyle}>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{truncated || 'No content generated.'}</p>
      </div>
      <CardFooter>
        <BarChart3 className="h-3 w-3" />
        <span>{wordCount} words</span>
        <span>&middot;</span>
        <span>{readTime} min read</span>
        {difficulty && (
          <>
            <span>&middot;</span>
            <Badge>{difficulty}</Badge>
          </>
        )}
      </CardFooter>
    </div>
  );
}

// =============================================================================
// RECOMMENDATIONS CARD
// =============================================================================

function RecommendationsCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const recs = safeArr(d.recommendations ?? d.items ?? d.suggestions ?? data);

  return (
    <div style={cardStyle}>
      <CardHeader
        icon={<Lightbulb className="h-4 w-4" />}
        title={`${recs.length} Recommendation${recs.length !== 1 ? 's' : ''}`}
      />
      <div style={{ ...bodyStyle, padding: 0 }}>
        {recs.length > 0 ? (
          recs.slice(0, 8).map((r, i) => {
            const item = asRecord(r);
            const title = safeStr(item.title ?? item.name ?? item.topic ?? r);
            const relevance = safeNum(item.relevance ?? item.score ?? item.confidence);
            const time = safeStr(item.estimatedTime ?? item.duration);
            const diff = safeStr(item.difficulty ?? item.level);
            return (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderBottom: i < recs.length - 1 ? '1px solid var(--sam-border)' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                {relevance > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sam-accent)', whiteSpace: 'nowrap', minWidth: 32 }}>
                    <Star className="h-3 w-3 inline-block" style={{ marginRight: 2, verticalAlign: -1 }} />
                    {relevance > 1 ? `${Math.round(relevance)}%` : `${Math.round(relevance * 100)}%`}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 11 }}>{title}</p>
                  {(time || diff) && (
                    <p style={{ fontSize: 9, color: 'var(--sam-text-muted)', marginTop: 2 }}>
                      {time && <span>{time}</span>}
                      {time && diff && <span> &middot; </span>}
                      {diff && <span>{diff}</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ padding: '10px 12px', color: 'var(--sam-text-muted)' }}>No recommendations available.</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SESSION CARD (schedule-session)
// =============================================================================

function SessionCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const session = asRecord(d.session ?? d);
  const duration = safeNum(session.duration ?? d.duration);
  const blocks = safeArr(session.blocks ?? session.segments ?? d.blocks);
  const topics = safeArr(session.topics ?? d.topics);

  let studyMin = 0;
  let breakMin = 0;
  blocks.forEach((b) => {
    const block = asRecord(b);
    const bType = safeStr(block.type);
    const bDur = safeNum(block.duration);
    if (bType === 'break') breakMin += bDur;
    else studyMin += bDur;
  });

  if (blocks.length === 0 && duration > 0) {
    studyMin = duration;
  }

  return (
    <div style={cardStyle}>
      <CardHeader
        icon={<Calendar className="h-4 w-4" />}
        title={`Study Session${duration ? ` \u00B7 ${duration} min` : ''}`}
      />
      <div style={bodyStyle}>
        {blocks.length > 0 && (
          <div style={{ display: 'flex', gap: 2, marginBottom: 8, height: 14, borderRadius: 4, overflow: 'hidden' }}>
            {blocks.map((b, i) => {
              const block = asRecord(b);
              const bType = safeStr(block.type);
              const bDur = safeNum(block.duration);
              const isBreak = bType === 'break';
              const pct = duration > 0 ? (bDur / duration) * 100 : 100 / blocks.length;
              return (
                <div
                  key={i}
                  style={{
                    width: `${pct}%`,
                    background: isBreak ? 'var(--sam-border)' : 'var(--sam-accent)',
                    opacity: isBreak ? 0.5 : 0.8,
                    minWidth: 4,
                  }}
                  title={`${bType} (${bDur} min)`}
                />
              );
            })}
          </div>
        )}
        {topics.length > 0 && (
          <p style={{ fontSize: 10, color: 'var(--sam-text-secondary)', marginBottom: 4 }}>
            Topics: {topics.map(safeStr).join(', ')}
          </p>
        )}
      </div>
      <CardFooter>
        <span>{studyMin} min study</span>
        {breakMin > 0 && (
          <>
            <span>&middot;</span>
            <span>{breakMin} min break</span>
          </>
        )}
      </CardFooter>
    </div>
  );
}

// =============================================================================
// REMINDER CARD
// =============================================================================

function ReminderCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const reminder = asRecord(d.reminder ?? d);
  const message = safeStr(reminder.message ?? d.message);
  const scheduledFor = safeStr(reminder.scheduledFor ?? d.scheduledFor);
  const rType = safeStr(reminder.type ?? d.type);
  const status = safeStr(reminder.status ?? d.status ?? 'pending');

  let timeStr = '';
  if (scheduledFor) {
    try {
      const date = new Date(scheduledFor);
      timeStr = date.toLocaleString(undefined, {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      timeStr = scheduledFor;
    }
  }

  return (
    <div style={cardStyle}>
      <CardHeader icon={<Clock className="h-4 w-4" />} title="Reminder Set" />
      <div style={bodyStyle}>
        {message && (
          <p style={{ fontWeight: 500, fontSize: 12, marginBottom: 6 }}>
            &ldquo;{message}&rdquo;
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {timeStr && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--sam-text-secondary)' }}>
              <Calendar className="h-3 w-3" /> {timeStr}
            </span>
          )}
          {rType && <Badge>{rType}</Badge>}
          <Badge color={status === 'pending' ? 'var(--sam-warning, #f59e0b)' : 'var(--sam-success, #22c55e)'}>{status}</Badge>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// OPTIMIZE CARD (schedule-optimize)
// =============================================================================

function OptimizeCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const schedule = asRecord(d.schedule ?? d.optimizedSchedule ?? d);
  const sessions = safeArr(schedule.sessions ?? schedule.blocks ?? d.sessions ?? d.days);
  const totalStudy = safeNum(schedule.totalStudyMinutes ?? d.totalStudyMinutes);
  const summary = safeStr(schedule.summary ?? d.summary ?? d.message);

  return (
    <div style={cardStyle}>
      <CardHeader icon={<CalendarCheck className="h-4 w-4" />} title="Optimized Schedule" />
      <div style={bodyStyle}>
        {summary && <p style={{ marginBottom: 6 }}>{summary}</p>}
        {sessions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sessions.slice(0, 7).map((s, i) => {
              const session = asRecord(s);
              const day = safeStr(session.day ?? session.date ?? session.label ?? `Day ${i + 1}`);
              const mins = safeNum(session.studyMinutes ?? session.duration ?? session.minutes);
              const topic = safeStr(session.topic ?? session.title);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                  <span style={{ fontWeight: 600, minWidth: 54, color: 'var(--sam-text-secondary)' }}>{day}</span>
                  {mins > 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--sam-border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (mins / 120) * 100)}%`, background: 'var(--sam-accent)', borderRadius: 3 }} />
                      </div>
                      <span style={{ color: 'var(--sam-text-muted)', minWidth: 30, textAlign: 'right' }}>{mins}m</span>
                    </div>
                  )}
                  {topic && <span style={{ color: 'var(--sam-text-muted)', fontSize: 9 }}>{topic}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {totalStudy > 0 && (
        <CardFooter>
          <span>Total: {Math.round(totalStudy / 60 * 10) / 10}h study time</span>
        </CardFooter>
      )}
    </div>
  );
}

// =============================================================================
// SCHEDULE LIST CARD (schedule-get)
// =============================================================================

function ScheduleListCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const sessions = safeArr(d.sessions ?? d.schedule ?? d.events ?? d.items ?? data);

  return (
    <div style={cardStyle}>
      <CardHeader icon={<ListChecks className="h-4 w-4" />} title="Schedule" />
      <div style={{ ...bodyStyle, padding: 0 }}>
        {sessions.length > 0 ? (
          sessions.slice(0, 10).map((s, i) => {
            const item = asRecord(s);
            const title = safeStr(item.title ?? item.topic ?? item.name);
            const time = safeStr(item.time ?? item.start ?? item.scheduledFor ?? item.date);
            const dur = safeNum(item.duration ?? item.minutes);
            let timeStr = time;
            if (time) {
              try {
                const d = new Date(time);
                if (!isNaN(d.getTime())) {
                  timeStr = d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
                }
              } catch { /* use raw string */ }
            }
            return (
              <div
                key={i}
                style={{
                  padding: '6px 12px',
                  borderBottom: i < sessions.length - 1 ? '1px solid var(--sam-border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Calendar className="h-3 w-3 shrink-0" style={{ color: 'var(--sam-accent)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 500, fontSize: 11 }}>{title || 'Session'}</span>
                  {timeStr && <span style={{ fontSize: 9, color: 'var(--sam-text-muted)', marginLeft: 6 }}>{timeStr}</span>}
                </div>
                {dur > 0 && <span style={{ fontSize: 9, color: 'var(--sam-text-muted)' }}>{dur}m</span>}
              </div>
            );
          })
        ) : (
          <p style={{ padding: '10px 12px', color: 'var(--sam-text-muted)' }}>No upcoming sessions.</p>
        )}
      </div>
      <CardFooter>
        <span>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
      </CardFooter>
    </div>
  );
}

// =============================================================================
// NOTIFICATION CARD (notification-send)
// =============================================================================

function NotificationCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const notif = asRecord(d.notification ?? d);
  const title = safeStr(notif.title ?? d.title);
  const body = safeStr(notif.body ?? notif.message ?? d.body ?? d.message);
  const nType = safeStr(notif.type ?? d.type);
  const priority = safeStr(notif.priority ?? d.priority);
  const channel = safeStr(notif.channel ?? d.channel ?? 'in_app');

  return (
    <div style={cardStyle}>
      <CardHeader icon={<BellRing className="h-4 w-4" />} title="Notification Sent" />
      <div style={bodyStyle}>
        {title && <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{title}</p>}
        {body && <p style={{ color: 'var(--sam-text-secondary)' }}>{body}</p>}
        <div style={{ ...separatorStyle }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {nType && (
            <span style={{ fontSize: 10, color: 'var(--sam-text-muted)' }}>Type: <strong>{nType}</strong></span>
          )}
          {priority && (
            <span style={{ fontSize: 10, color: 'var(--sam-text-muted)' }}>Priority: <strong>{priority}</strong></span>
          )}
          <span style={{ fontSize: 10, color: 'var(--sam-text-muted)' }}>Channel: <strong>{channel}</strong></span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// NOTIFICATION LIST CARD (notification-get)
// =============================================================================

function NotificationListCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const notifications = safeArr(d.notifications ?? d.items ?? data);

  return (
    <div style={cardStyle}>
      <CardHeader icon={<Bell className="h-4 w-4" />} title={`${notifications.length} Notification${notifications.length !== 1 ? 's' : ''}`} />
      <div style={{ ...bodyStyle, padding: 0 }}>
        {notifications.length > 0 ? (
          notifications.slice(0, 8).map((n, i) => {
            const item = asRecord(n);
            const title = safeStr(item.title ?? item.name);
            const body = safeStr(item.body ?? item.message);
            const status = safeStr(item.status);
            const isUnread = status === 'unread';
            return (
              <div
                key={i}
                style={{
                  padding: '6px 12px',
                  borderBottom: i < notifications.length - 1 ? '1px solid var(--sam-border)' : 'none',
                  opacity: isUnread ? 1 : 0.7,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isUnread && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sam-accent)', flexShrink: 0 }} />}
                  <span style={{ fontWeight: isUnread ? 600 : 400, fontSize: 11 }}>{title || body || 'Notification'}</span>
                </div>
                {title && body && (
                  <p style={{ fontSize: 10, color: 'var(--sam-text-muted)', marginTop: 1, paddingLeft: isUnread ? 11 : 0 }}>
                    {body.length > 80 ? body.slice(0, 80) + '...' : body}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p style={{ padding: '10px 12px', color: 'var(--sam-text-muted)' }}>No notifications.</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CONFIRMATION CARD (notification-mark-read, etc.)
// =============================================================================

function ConfirmationCard({ data, label }: { data: unknown; label: string }) {
  const d = asRecord(data);
  const count = safeNum(d.marked ?? d.count ?? d.affected ?? 1);
  const message = safeStr(d.message ?? d.summary);

  return (
    <div style={cardStyle}>
      <div style={{ ...bodyStyle, display: 'flex', alignItems: 'center', gap: 8, padding: '12px' }}>
        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--sam-success, #22c55e)' }} />
        <span style={{ fontWeight: 500, fontSize: 12 }}>
          {message || `${count} ${label}`}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// PROGRESS REPORT CARD
// =============================================================================

function ProgressReportCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const period = safeStr(d.period ?? 'weekly');
  const metrics = asRecord(d.metrics ?? d.stats ?? d);
  const comparison = asRecord(d.comparison ?? d.change);

  const items: Array<{ label: string; value: string; pct: number; raw: number }> = [];

  const studyTime = safeNum(metrics.studyTime ?? metrics.totalStudyMinutes ?? metrics.studyMinutes);
  if (studyTime > 0) items.push({ label: 'Study Time', value: `${(studyTime / 60).toFixed(1)}h`, pct: Math.min(100, (studyTime / 600) * 100), raw: studyTime });

  const lessons = safeNum(metrics.lessons ?? metrics.lessonsCompleted ?? metrics.completedLessons);
  if (lessons > 0) items.push({ label: 'Lessons', value: String(lessons), pct: Math.min(100, (lessons / 20) * 100), raw: lessons });

  const avgScore = safeNum(metrics.avgScore ?? metrics.averageScore ?? metrics.score);
  if (avgScore > 0) items.push({ label: 'Avg Score', value: `${Math.round(avgScore)}%`, pct: avgScore, raw: avgScore });

  const streak = safeNum(metrics.streak ?? metrics.dayStreak);
  if (streak > 0) items.push({ label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, pct: Math.min(100, (streak / 14) * 100), raw: streak });

  const trend = safeStr(comparison.trend ?? comparison.direction);
  const changePct = safeNum(comparison.percentage ?? comparison.change);

  return (
    <div style={cardStyle}>
      <CardHeader
        icon={<BarChart3 className="h-4 w-4" />}
        title={`${period.charAt(0).toUpperCase() + period.slice(1)} Progress Report`}
      />
      <div style={bodyStyle}>
        {items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ ...labelStyle }}>{item.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--sam-text)' }}>{item.value}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--sam-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: 'var(--sam-accent)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--sam-text-muted)' }}>
            {typeof data === 'string' ? data : 'No metrics available for this period.'}
          </p>
        )}
      </div>
      {(trend || changePct !== 0) && (
        <CardFooter>
          <span style={{ color: trend === 'up' || changePct > 0 ? 'var(--sam-success, #22c55e)' : trend === 'down' || changePct < 0 ? 'var(--sam-error, #ef4444)' : 'var(--sam-text-muted)' }}>
            {changePct > 0 ? '+' : ''}{changePct}% vs last {period}
          </span>
        </CardFooter>
      )}
    </div>
  );
}

// =============================================================================
// ACHIEVEMENT CARD
// =============================================================================

function AchievementCard({ data }: { data: unknown }) {
  const d = asRecord(data);
  const achievement = asRecord(d.achievement ?? d);
  const name = safeStr(achievement.name ?? achievement.title ?? d.name);
  const description = safeStr(achievement.description ?? d.description);
  const rarity = safeStr(achievement.rarity ?? d.rarity ?? 'common');

  const rarityColors: Record<string, string> = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
  };

  return (
    <div style={{ ...cardStyle, borderLeftColor: rarityColors[rarity] ?? 'var(--sam-accent)' }}>
      <div style={{ ...bodyStyle, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (rarityColors[rarity] ?? 'var(--sam-accent)') + '20',
          flexShrink: 0,
        }}>
          <Trophy className="h-5 w-5" style={{ color: rarityColors[rarity] ?? 'var(--sam-accent)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{name || 'Achievement Unlocked!'}</p>
          {description && <p style={{ fontSize: 11, color: 'var(--sam-text-secondary)' }}>{description}</p>}
          <Badge color={rarityColors[rarity]}>{rarity}</Badge>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// GENERIC CARD (fallback)
// =============================================================================

function GenericCard({ data, toolName }: { data: unknown; toolName: string }) {
  let content: string;
  if (typeof data === 'string') {
    content = data;
  } else if (data === null || data === undefined) {
    content = 'No output.';
  } else {
    try {
      content = JSON.stringify(data, null, 2);
    } catch {
      content = String(data);
    }
  }

  const truncated = content.length > 500 ? content.slice(0, 500) + '...' : content;

  return (
    <div style={cardStyle}>
      <CardHeader icon={<Wrench className="h-4 w-4" />} title={toolName} />
      <div style={bodyStyle}>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 10, margin: 0 }}>
          {truncated}
        </pre>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ToolResultCard({ toolId, toolName, result, status }: ToolResultCardProps) {
  if (status === 'failed') return <FailedCard toolName={toolName} />;

  const output = extractOutput(result);

  switch (toolId) {
    case 'external-calculator':
      return <CalculatorCard data={output} />;
    case 'external-dictionary':
      return <DictionaryCard data={output} />;
    case 'external-wikipedia':
      return <WikipediaCard data={output} />;
    case 'external-web-search':
      return <SearchResultsCard data={output} />;
    case 'external-url-fetch':
      return <UrlFetchCard data={output} />;
    case 'content-generate':
      return <ContentCard data={output} type="generate" />;
    case 'content-summarize':
      return <ContentCard data={output} type="summarize" />;
    case 'content-recommend':
      return <RecommendationsCard data={output} />;
    case 'schedule-session':
      return <SessionCard data={output} />;
    case 'schedule-reminder':
      return <ReminderCard data={output} />;
    case 'schedule-optimize':
      return <OptimizeCard data={output} />;
    case 'schedule-get':
      return <ScheduleListCard data={output} />;
    case 'notification-send':
      return <NotificationCard data={output} />;
    case 'notification-get':
      return <NotificationListCard data={output} />;
    case 'notification-mark-read':
      return <ConfirmationCard data={output} label="marked as read" />;
    case 'notification-progress-report':
      return <ProgressReportCard data={output} />;
    case 'notification-achievement':
      return <AchievementCard data={output} />;
    default:
      return <GenericCard data={output} toolName={toolName} />;
  }
}
