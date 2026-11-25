import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../../src/services/api';
import { colors, spacing, typography } from '../../../src/theme';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { ScreenContainer } from '../../../src/components/ScreenContainer';

export default function BlogDetailScreen() {
  const { slug = '' } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.publicGetBlogBySlug(slug as string).then(d => setPost(d?.post)).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingScreen />;
  if (!post) return <ScreenContainer title={t('common.error')} onBack={() => router.back()}><Text style={{ color: colors.textBody }}>{t('common.noData')}</Text></ScreenContainer>;

  return (
    <ScreenContainer title={post?.title ?? ''} onBack={() => router.back()}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.display, { marginBottom: spacing.sm }]}>{post?.title ?? ''}</Text>
        <View style={styles.meta}>
          {post?.authorName ? <Text style={styles.author}>{post.authorName}</Text> : null}
          {post?.publishedAt ? <Text style={styles.date}>{new Date(post.publishedAt).toLocaleDateString()}</Text> : null}
        </View>
        <Text style={[typography.body, { lineHeight: 26 }]}>{post?.content ?? ''}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.md },
  author: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  date: { fontSize: 14, color: colors.textMuted },
});
