import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { SkillCategory } from '../../catalog/catalog.types';

const SKILL_CATEGORIES: SkillCategory[] = ['Physical', 'Technical', 'Tactical', 'Mental'];

export class SaveSkillDto {
  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(120)
  name: string;

  @IsIn(SKILL_CATEGORIES, { message: 'Category must be Physical, Technical, Tactical, or Mental.' })
  category: SkillCategory;

  @IsString()
  @IsNotEmpty({ message: 'Este campo es obligatorio.' })
  @MaxLength(250)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  glyph?: string;
}
