import { useEffect } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { currentCharactersAtom, currentSceneModeAtom, totalCharactersAtom, updateUserInfoAtom } from "~/atoms";
import { useDisclosure } from "@mantine/hooks";
import { Button, Drawer, Image, Radio, SimpleGrid, Stack, Text } from "@mantine/core";
import { characterImageUrl } from "~/utils/buildUrl";
import { manuallyShowKeySettingModalAtom } from "../KeySettingModal";
import { type Character, SceneMode } from "~/types";

export const isShowSettingAtom = atom(false);

interface SingleCharacterSelectorProps {
  title: string
  characters: Character[]
  selectedCharacter?: Character
  onCharacterSelect?: (character: Character) => void
}

function SingleCharacterSelector ({ title, characters, selectedCharacter, onCharacterSelect }: SingleCharacterSelectorProps) {
  return (
    <Stack gap="xs">
      <Text size="md">{ title }</Text>
      <SimpleGrid cols={3}>
        {
          characters.map(character => {
            const { id, name, nickname, slogan } = character;
            const isSelected = character.id === selectedCharacter?.id;
            return (
              <div key={id}>
                <Image
                  src={characterImageUrl(name)}
                  alt="角色图片"
                  radius="md"
                  className="cursor-pointer"
                  style={isSelected ? {
                    border: "2px solid #228be6",
                    borderRadius: "0.5rem",
                  } : {}}
                  onClick={() => onCharacterSelect?.(character)}
                />
                <Text size="xs" className="text-center">{nickname}：{slogan}</Text>
              </div>
            );
          })
        }
      </SimpleGrid>
    </Stack>
  );
}

function ToggleCharacters () {
  const updateUserInfo = useSetAtom(updateUserInfoAtom);
  const sceneMode = useAtomValue(currentSceneModeAtom);
  const totalCharacters = useAtomValue(totalCharactersAtom);
  const selectedCharacters = useAtomValue(currentCharactersAtom);

  const handleSingleCharacterSelect = (character: Character) => {
    updateUserInfo({ singleCharacterId: character.id  });
  };

  const handleAlienCharactersSelect = (character: Character) => {
    updateUserInfo({ alienCharacterId: character.id });
  };

  const handleAlienTranslatorsSelect = (character: Character) => {
    updateUserInfo({ alienTranslatorId: character.id });
  };

  if (sceneMode === SceneMode.SingleCharacterMode) {
    const title = "角色选择";
    const selectedCharacter = selectedCharacters[0];
    const characters = totalCharacters.filter(character => character.adaptSceneModes.includes(SceneMode.SingleCharacterMode));
    return (
      <SingleCharacterSelector
        title={title}
        characters={characters}
        selectedCharacter={selectedCharacter}
        onCharacterSelect={handleSingleCharacterSelect}
      />
    );
  } else if (sceneMode === SceneMode.AlienMode) {
    const alienCharacters = totalCharacters.filter(character => (
      character.adaptSceneModes.length === 1 &&
      character.adaptSceneModes[0] === SceneMode.AlienMode
    ));
    const selectedAlienCharacter = selectedCharacters[0];
    const alienTranslators = totalCharacters.filter(character => (
      character.adaptSceneModes.length > 1 &&
      character.adaptSceneModes.includes(SceneMode.AlienMode)
    ));
    const selectedAlienTranslator = selectedCharacters[1];
    return (
      <>
        <SingleCharacterSelector
          title="不会说人话的角色选择"
          characters={alienCharacters}
          selectedCharacter={selectedAlienCharacter}
          onCharacterSelect={handleAlienCharactersSelect}
        />
        <SingleCharacterSelector
          title="翻译角色选择"
          characters={alienTranslators}
          selectedCharacter={selectedAlienTranslator}
          onCharacterSelect={handleAlienTranslatorsSelect}
        />
      </>
    );
  } else {
    return null;
  }
}

export function SettingDrawer () {
  const [isShowSetting, setIsShowSetting] = useAtom(isShowSettingAtom);
  const [sceneMode, setSceneMode] = useAtom(currentSceneModeAtom);
  const setManuallyShowKeySettingModal = useSetAtom(manuallyShowKeySettingModalAtom);
  const [opened, { open, close }] = useDisclosure(false);

  const handleModeChange = (value: string) => {
    setSceneMode(value as SceneMode);
  };

  const hideSetting = () => setIsShowSetting(false);

  useEffect(() => {
    if (isShowSetting && !opened) {
      open();
    } else if (!isShowSetting && opened) {
      close();
    }
  }, [isShowSetting, opened, open, close]);

  return (
    <Drawer opened={opened} onClose={hideSetting} title={<Text size={"lg"}>设置</Text>}>
      <Stack>
        <Button variant="outline" onClick={() => {
          hideSetting();
          setManuallyShowKeySettingModal(true);
        }}>语音和大模型接口请求设置</Button>
        <Radio.Group
          value={sceneMode}
          onChange={handleModeChange}
          name="sceneModeSelector"
          label="模式选择"
          size="md"
          withAsterisk
        >
          <Stack mt="xs" gap="xs">
            <Radio size="sm" value={SceneMode.SingleCharacterMode} label="单角色模式" description="只和一个角色互动" />
            <Radio size="sm" value={SceneMode.AlienMode} label="外星人模式" description="和一个不会说人话的角色聊天，会有翻译角色在中间做桥梁" />
          </Stack>
        </Radio.Group>

        <ToggleCharacters />
      </Stack>
    </Drawer>
  );
}
