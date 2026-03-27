import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTab } from '../state';

export interface BottomTabsProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const TAB_ORDER: AppTab[] = ['Now', 'Day', 'Place'];

export function BottomTabs(props: BottomTabsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {TAB_ORDER.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => props.onSelectTab(tab)}
          style={[styles.tab, props.activeTab === tab ? styles.tabActive : null]}
        >
          <Text style={styles.tabText}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#08111F',
    borderRadius: 999,
    padding: 6,
    gap: 6
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center'
  },
  tabActive: {
    backgroundColor: '#F4A623'
  },
  tabText: {
    color: '#F3F8FF',
    fontWeight: '600'
  }
});
