import { NextRequest, NextResponse } from 'next/server';

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

const SIZE_MAP: Record<string, string> = {
  '1-10': '1,10',
  '11-50': '11,50',
  '51-200': '51,200',
  '201-500': '201,500',
  '501-1000': '501,1000',
  '1000+': '1001,10000',
};

function mapContact(person: any) {
  const org = person.organization || {};
  const employment = person.employment_history?.[0] || {};

  const companyName = org.name || person.organization_name || employment.organization_name || '';
  
  let website = org.website_url || '';
  if (!website && org.primary_domain) website = `https://${org.primary_domain}`;
  if (!website && person.organization_website_url) website = person.organization_website_url;

  let companyLinkedin = '';
  if (org.linkedin_url) {
    companyLinkedin = org.linkedin_url.startsWith('http') 
      ? org.linkedin_url 
      : `https://www.linkedin.com/company/${org.linkedin_url}`;
  }

  let linkedin = '';
  if (person.linkedin_url) {
    linkedin = person.linkedin_url.startsWith('http')
      ? person.linkedin_url
      : `https://www.linkedin.com/in/${person.linkedin_url}`;
  }

  const size = org.estimated_num_employees 
    ? `${org.estimated_num_employees.toLocaleString()} employees`
    : org.num_employees 
    ? `${org.num_employees.toLocaleString()} employees`
    : '';

  const industry = org.industry || org.keywords?.[0] || '';

  let signal = '';
  if (org.latest_funding_stage) signal = `Funding: ${org.latest_funding_stage}`;
  else if (org.total_funding) signal = `Total funding: $${(org.total_funding / 1000000).toFixed(1)}M`;
  else if (org.founded_year) signal = `Founded: ${org.founded_year}`;

  return {
    id: person.id,
    name: `${person.first_name || ''} ${person.last_name || person.last_name_obfuscated || ''}`.trim(),
    title: person.title || '',
    company: companyName,
    website,
    companyLinkedin,
    linkedin,
    email: person.email || '',
    location: [person.city, person.state, person.country].filter(Boolean).join(', '),
    size,
    industry,
    signal,
    hasEmail: person.has_email || false,
    revealed: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { mode, command, filters, action, contactIds } = await req.json();

    if (action === 'reveal' && contactIds?.length) {
      const revealRes = await fetch('https://api.apollo.io/api/v1/people/bulk_match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY!,
        },
        body: JSON.stringify({
          details: contactIds.map((id: string) => ({ id })),
          reveal_personal_emails: true,
        }),
      });

      const revealData = await revealRes.json();
      console.log('Reveal response:', JSON.stringify(revealData?.matches?.[0] || revealData?.people?.[0], null, 2));

      const revealed = (revealData.matches || revealData.people || []).map((p: any) => {
        const org = p.organization || {};
        let website = org.website_url || '';
        if (!website && org.primary_domain) website = `https://${org.primary_domain}`;

        let companyLinkedin = '';
        if (org.linkedin_url) {
          companyLinkedin = org.linkedin_url.startsWith('http')
            ? org.linkedin_url
            : `https://www.linkedin.com/company/${org.linkedin_url}`;
        }

        let linkedin = '';
        if (p.linkedin_url) {
          linkedin = p.linkedin_url.startsWith('http')
            ? p.linkedin_url
            : `https://www.linkedin.com/in/${p.linkedin_url}`;
        }

        return {
          id: p.id,
          email: p.email || '',
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          linkedin,
          companyLinkedin,
          website,
          location: [p.city, p.state, p.country].filter(Boolean).join(', '),
          size: org.estimated_num_employees ? `${org.estimated_num_employees.toLocaleString()} employees` : '',
          industry: org.industry || '',
          signal: org.latest_funding_stage ? `Funding: ${org.latest_funding_stage}` : '',
        };
      });

      return NextResponse.json({ revealed });
    }

    let titles: string[] = [];
    let locations: string[] = [];
    let employeeRanges: string[] = [];
    let keywords: string[] = [];
    let count = 25;

    if (mode === 'command' && command) {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Extract Apollo search filters from this ICP request. Return ONLY a JSON object:
{
  "titles": ["VP Sales", "Head of Sales"],
  "locations": ["United States", "United Kingdom"],
  "employee_ranges": ["11,50", "51,200"],
  "keywords": ["SaaS", "B2B"],
  "count": 25
}
Request: "${command}"
Return ONLY the JSON.`
          }]
        })
      });

      const anthropicData = await anthropicRes.json();
      const text = anthropicData.content?.[0]?.text || '{}';
      const match = text.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : {};

      titles = parsed.titles || [];
      locations = parsed.locations || [];
      employeeRanges = parsed.employee_ranges || [];
      keywords = parsed.keywords || [];
      count = Math.min(parsed.count || 25, 100);

    } else {
      titles = filters.titles || [];
      locations = filters.locations || [];
      employeeRanges = (filters.sizes || []).map((s: string) => SIZE_MAP[s]).filter(Boolean);
      keywords = filters.industries || [];
      if (filters.hiringRoles) keywords.push(filters.hiringRoles);
      count = Math.min(filters.count || 25, 100);
    }

    const apolloParams: any = { page: 1, per_page: count };
    if (titles.length > 0) apolloParams.person_titles = titles;
    if (locations.length > 0) apolloParams.person_locations = locations;
    if (employeeRanges.length > 0) apolloParams.organization_num_employees_ranges = employeeRanges;
    if (keywords.length > 0) apolloParams.q_keywords = keywords.join(' ');

    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY!,
      },
      body: JSON.stringify(apolloParams),
    });

    const data = await res.json();
    console.log('First person raw:', JSON.stringify(data.people?.[0], null, 2));
    if (!res.ok) throw new Error(data.message || `Apollo error ${res.status}`);

    const contacts = (data.people || []).map(mapContact);
    return NextResponse.json({ contacts, total: data.pagination?.total_entries || contacts.length });

  } catch (error: any) {
    console.error('ICP error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}