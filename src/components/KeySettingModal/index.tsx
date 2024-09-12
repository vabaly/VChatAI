/**
 * @file If key information is not provided it is displayed and cannot be turned off, once provided it can be displayed manually.
 */

import { Input, Modal, Stack } from "@mantine/core";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { updateUserInfoAtom, userInfoAtom } from "~/atoms";

export const manuallyShowKeySettingModalAtom = atom(false);

export function KeySettingModal () {
  const userInfo = useAtomValue(userInfoAtom);
  const updateUserInfo = useSetAtom(updateUserInfoAtom);
  const [manuallyShowKeySettingModal, setManuallyShowKeySettingModal] = useAtom(manuallyShowKeySettingModalAtom);
  const { azureSpeechKey = "", azureSpeechRegion = "", azureOpenAIApiKey = "", azureOpenAIApiDeploymentName = "", azureOpenAIApiInstanceName = "", azureOpenAIApiVersion = "" } = userInfo;
  const hasSdkInfo = !!(azureSpeechKey && azureSpeechRegion && azureOpenAIApiKey && azureOpenAIApiDeploymentName && azureOpenAIApiInstanceName && azureOpenAIApiVersion);
  const isShowKeySettingModal = useMemo(() => {
    if (hasSdkInfo) {
      return manuallyShowKeySettingModal;
    } else {
      return true;
    }
  }, [hasSdkInfo, manuallyShowKeySettingModal]);

  return (
    <Modal opened={isShowKeySettingModal} withCloseButton={hasSdkInfo} onClose={() => setManuallyShowKeySettingModal(false)} title="请填写必要信息">
      <Stack gap={20}>
        <Stack gap={5}>
          <Input.Wrapper required label="微软文本转语音的 API key">
            <Input placeholder="请输入微软文本转语音的 API key" value={azureSpeechKey} onChange={(event) => updateUserInfo({ azureSpeechKey: event.target.value })} />
          </Input.Wrapper>
          <Input.Wrapper required label="微软文本转语音 Region 信息">
            <Input placeholder="请输入微软文本转语音的 Region" value={azureSpeechRegion} onChange={(event) => updateUserInfo({ azureSpeechRegion: event.target.value })} />
          </Input.Wrapper>
          <Input.Wrapper required label="微软 OpenAI 密钥">
            <Input placeholder="请输入微软 OpenAI 密钥" value={azureOpenAIApiKey} onChange={(event) => updateUserInfo({ azureOpenAIApiKey: event.target.value })} />
          </Input.Wrapper>
          <Input.Wrapper required label="微软 OpenAI 部署名称">
            <Input placeholder="请输入微软 OpenAI 部署名称" value={azureOpenAIApiDeploymentName} onChange={(event) => updateUserInfo({ azureOpenAIApiDeploymentName: event.target.value })} />
          </Input.Wrapper>
          <Input.Wrapper required label="微软 OpenAI 实例名称">
            <Input placeholder="请输入微软 OpenAI 实例名称" value={azureOpenAIApiInstanceName} onChange={(event) => updateUserInfo({ azureOpenAIApiInstanceName: event.target.value })} />
          </Input.Wrapper>
          <Input.Wrapper required label="微软 OpenAI API Version">
            <Input placeholder="微软 OpenAI API Version" value={azureOpenAIApiVersion} onChange={(event) => updateUserInfo({ azureOpenAIApiVersion: event.target.value })} />
          </Input.Wrapper>
        </Stack>
      </Stack>
    </Modal>
  );
};
