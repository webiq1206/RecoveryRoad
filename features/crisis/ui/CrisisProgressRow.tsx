import React from 'react';
import { View } from 'react-native';

import { crisisStyles } from './styles';

export function CrisisProgressRow(props: { total: number; activeIndex: number }) {
  const { total, activeIndex } = props;
  return (
    <View style={crisisStyles.progressRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={[
            crisisStyles.progressSegment,
            i < activeIndex && crisisStyles.progressSegmentDone,
            i === activeIndex && crisisStyles.progressSegmentActive,
          ]}
        />
      ))}
    </View>
  );
}

