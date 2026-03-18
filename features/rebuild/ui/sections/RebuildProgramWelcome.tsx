import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, Compass, Heart, Shield, Target } from 'lucide-react-native';

export function RebuildProgramWelcome(props: {
  onStartProgram: () => void;
  Colors: any;
  styles: any;
}) {
  const { onStartProgram, Colors, styles } = props;

  return (
    <View style={styles.sectionContent}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIconWrap}>
          <Compass size={28} color="#B9F6CA" />
        </View>
        <Text style={styles.welcomeTitle}>Identity Rebuild Program</Text>
        <Text style={styles.welcomeDesc}>
          An 8-week guided journey to rediscover your worth, clarify your values, find purpose, and set meaningful life goals.
        </Text>
        <View style={styles.welcomeFeatures}>
          {[
            { icon: <Heart size={14} color="#FF8A80" />, text: 'Self-worth restoration' },
            { icon: <Shield size={14} color="#82B1FF" />, text: 'Values clarification' },
            { icon: <Compass size={14} color="#B9F6CA" />, text: 'Purpose mapping' },
            { icon: <Target size={14} color="#FFD180" />, text: 'Long-term life goals' },
          ].map((f, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={i} style={styles.welcomeFeatureRow}>
              {f.icon}
              <Text style={styles.welcomeFeatureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.startProgramBtn} onPress={onStartProgram} activeOpacity={0.7}>
          <Text style={styles.startProgramBtnText}>Begin Your Journey</Text>
          <ArrowRight size={16} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

