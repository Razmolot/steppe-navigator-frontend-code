import { useEffect, useMemo, useState } from 'react';
import { Card, List, Typography, Spin, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from '../hooks/useTranslation';

const { Title, Text } = Typography;

type LocalizedText = {
  ru: string;
  kk: string;
  en: string;
};

type LibraryItem = {
  title: LocalizedText;
  // relative to /app/library/files/
  path_ru: string;
  path_kk: string;
  path_en: string;
};

type LibraryManifest = {
  common: LibraryItem[];
  '8': LibraryItem[];
  '9': LibraryItem[];
  '10': LibraryItem[];
  '11': LibraryItem[];
};

const SECTIONS: Array<keyof LibraryManifest> = ['common', '8', '9', '10', '11'];

export const LibraryPage = () => {
  const { t, locale } = useTranslation();
  const [manifest, setManifest] = useState<LibraryManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = useMemo(() => (import.meta as any).env.BASE_URL || '/app/', []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${baseUrl}library/manifest.json`, {
          cache: 'no-cache',
        });

        if (!res.ok) {
          throw new Error(`Failed to load manifest: ${res.status}`);
        }

        const data = (await res.json()) as LibraryManifest;

        if (!cancelled) setManifest(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load library');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <Title level={2} style={{ marginBottom: 16 }}>
        {t.library.title}
      </Title>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {SECTIONS.map((section) => {
          const items = manifest?.[section] ?? [];
          const sectionTitle =
            section === 'common'
              ? t.library.common
              : section === '8'
                ? t.library.grade8
                : section === '9'
                  ? t.library.grade9
                  : section === '10'
                    ? t.library.grade10
                    : t.library.grade11;

          return (
            <Card key={section} title={sectionTitle}>
              {items.length === 0 ? (
                <Text type="secondary">{t.library.empty}</Text>
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={items}
                  renderItem={(item) => {
                    // Fallback logic:
                    // - kk → prefer kk, else ru, else en
                    // - en → prefer en, else ru, else kk
                    // - ru → prefer ru, else kk, else en
                    const localizedPath =
                      locale === 'kk'
                        ? (item.path_kk || item.path_ru || item.path_en)
                        : locale === 'en'
                          ? (item.path_en || item.path_ru || item.path_kk)
                          : (item.path_ru || item.path_kk || item.path_en);

                    const href = `${baseUrl}library/files/${localizedPath}`;
                    const title = item.title[locale] || item.title.ru;

                    return (
                      <List.Item>
                        <a href={href} download style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <DownloadOutlined />
                          {title}
                        </a>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
